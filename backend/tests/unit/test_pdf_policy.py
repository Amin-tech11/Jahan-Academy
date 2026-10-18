import io
import struct
import subprocess
import zlib
from unittest.mock import Mock

import pytest
from pypdf import PdfWriter
from pypdf.generic import ArrayObject, DictionaryObject, NameObject, TextStringObject

from app.modules.media.validation import MediaContentValidator, MediaValidationError


def raw_pdf(catalog_extra: bytes = b"", page_extra: bytes = b"") -> bytes:
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R " + catalog_extra + b" >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] " + page_extra + b" >>",
    ]
    pdf = b"%PDF-1.7\n"
    offsets = []
    for number, obj in enumerate(objects, 1):
        offsets.append(len(pdf))
        pdf += str(number).encode() + b" 0 obj\n" + obj + b"\nendobj\n"
    xref = len(pdf)
    pdf += b"xref\n0 4\n0000000000 65535 f \n"
    for offset in offsets:
        pdf += f"{offset:010d} 00000 n \n".encode()
    return pdf + f"trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()


def validate(content: bytes) -> None:
    MediaContentValidator(1000000).validate(content, "application/pdf")


@pytest.mark.parametrize(
    "entry",
    [
        b"/Open#41ction << /S /Java#53cript /J#53 (void\\(0\\)) >>",
        b"/AA << /WC << /S /Launch /F (file) >> >>",
        b"/Names << /Embedded#46iles << /Names [] >> >>",
        b"/AcroForm << /XFA (ignored) >>",
        b"/A << /S /URI /URI (javascript:void\\(0\\)) >>",
    ],
)
def test_encoded_and_indirect_active_content_is_rejected(entry: bytes) -> None:
    with pytest.raises(MediaValidationError) as error:
        validate(raw_pdf(entry))
    assert error.value.code == "MEDIA_PDF_ACTIVE_CONTENT_REJECTED"


def test_plain_pdf_and_inert_text_with_keyword_are_accepted() -> None:
    validate(raw_pdf())
    validate(raw_pdf(b"/MetadataNote (literal /JS and /OpenAction are not actions)"))
    validate(
        raw_pdf(
            page_extra=b"/Annots [<< /Subtype /Link /A << /S /URI /URI (https://example.com) >> >>]"
        )
    )


def test_compressed_object_stream_action_is_rejected() -> None:
    pdf = b"%PDF-1.7\n"
    offsets: dict[int, int] = {}

    def add(number: int, content: bytes) -> None:
        nonlocal pdf
        offsets[number] = len(pdf)
        pdf += str(number).encode() + b" 0 obj\n" + content + b"\nendobj\n"

    add(1, b"<< /Type /Catalog /Pages 2 0 R >>")
    add(2, b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    add(3, b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Annots [4 0 R] >>")
    compressed = zlib.compress(
        b"4 0 << /Type /Annot /Subtype /Link /A << /S /Java#53cript /J#53 (void\\(0\\)) >> >>"
    )
    add(
        5,
        (
            f"<< /Type /ObjStm /N 1 /First 4 /Filter /FlateDecode "
            f"/Length {len(compressed)} >>\nstream\n"
        ).encode()
        + compressed
        + b"\nendstream",
    )
    offsets[6] = len(pdf)
    entries = b"".join(
        struct.pack(
            ">BIH",
            0 if n == 0 else 2 if n == 4 else 1,
            0 if n == 0 else 5 if n == 4 else offsets[n],
            65535 if n == 0 else 0,
        )
        for n in range(7)
    )
    xref = zlib.compress(entries)
    add(
        6,
        (
            f"<< /Type /XRef /Size 7 /Root 1 0 R /W [1 4 2] "
            f"/Filter /FlateDecode /Length {len(xref)} >>\nstream\n"
        ).encode()
        + xref
        + b"\nendstream",
    )
    pdf += f"startxref\n{offsets[6]}\n%%EOF\n".encode()
    with pytest.raises(MediaValidationError) as error:
        validate(pdf)
    assert error.value.code == "MEDIA_PDF_ACTIVE_CONTENT_REJECTED"


def test_encrypted_pdf_is_not_published() -> None:
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    writer.encrypt("synthetic-password")
    output = io.BytesIO()
    writer.write(output)
    with pytest.raises(MediaValidationError) as error:
        validate(output.getvalue())
    assert error.value.code == "MEDIA_PDF_ENCRYPTED"


def test_malformed_pdf_and_excessive_nesting_fail_closed() -> None:
    with pytest.raises(MediaValidationError):
        validate(b"%PDF-1.7\nnot a document\n%%EOF")
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    nested = ArrayObject([TextStringObject("end")])
    for _ in range(120):
        nested = ArrayObject([nested])
    writer.root_object[NameObject("/Nested")] = DictionaryObject({NameObject("/Value"): nested})
    output = io.BytesIO()
    writer.write(output)
    with pytest.raises(MediaValidationError) as error:
        validate(output.getvalue())
    assert error.value.code == "MEDIA_PDF_LIMIT_EXCEEDED"


def test_parser_timeout_cannot_publish(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(subprocess, "run", Mock(side_effect=subprocess.TimeoutExpired("pdf", 10)))
    with pytest.raises(MediaValidationError) as error:
        validate(raw_pdf())
    assert error.value.code == "MEDIA_PDF_LIMIT_EXCEEDED"


@pytest.mark.parametrize(
    "subtype", ["/3D", "/Screen", "/Sound", "/Movie", "/FileAttachment", "/RichMedia"]
)
def test_indirect_annotation_subtypes_are_rejected(subtype: str) -> None:
    writer = PdfWriter()
    page = writer.add_blank_page(width=100, height=100)
    annotation = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Annot"),
            NameObject("/Subtype"): writer._add_object(NameObject(subtype)),
        }
    )
    page[NameObject("/Annots")] = ArrayObject([writer._add_object(annotation)])
    output = io.BytesIO()
    writer.write(output)
    with pytest.raises(MediaValidationError) as error:
        validate(output.getvalue())
    assert error.value.code == "MEDIA_PDF_ACTIVE_CONTENT_REJECTED"


@pytest.mark.parametrize("field,value", [("/S", "/JavaScript"), ("/Type", "/Action")])
def test_indirect_action_discriminators_are_resolved(field: str, value: str) -> None:
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    writer.root_object[NameObject("/PolicyFixture")] = DictionaryObject(
        {
            NameObject(field): writer._add_object(NameObject(value)),
        }
    )
    output = io.BytesIO()
    writer.write(output)
    with pytest.raises(MediaValidationError) as error:
        validate(output.getvalue())
    assert error.value.code == "MEDIA_PDF_ACTIVE_CONTENT_REJECTED"


def test_shared_object_cannot_lose_action_context() -> None:
    writer = PdfWriter()
    page = writer.add_blank_page(width=100, height=100)
    action = writer._add_object(DictionaryObject({NameObject("/S"): NameObject("/UnknownAction")}))
    # Traversal sees the benign-context reference first, then must inspect /A again.
    page[NameObject("/A")] = action
    page[NameObject("/PolicyFixture")] = action
    output = io.BytesIO()
    writer.write(output)
    with pytest.raises(MediaValidationError) as error:
        validate(output.getvalue())
    assert error.value.code == "MEDIA_PDF_ACTIVE_CONTENT_REJECTED"


def test_safe_indirect_link_values_remain_supported() -> None:
    writer = PdfWriter()
    page = writer.add_blank_page(width=100, height=100)
    action = DictionaryObject(
        {
            NameObject("/Type"): writer._add_object(NameObject("/Action")),
            NameObject("/S"): writer._add_object(NameObject("/URI")),
            NameObject("/URI"): writer._add_object(TextStringObject("https://example.com/guide")),
        }
    )
    page[NameObject("/A")] = writer._add_object(action)
    output = io.BytesIO()
    writer.write(output)
    validate(output.getvalue())
