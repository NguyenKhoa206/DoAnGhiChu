// A small, dependency-free Open XML package. ZIP entries use the standard store method.
const encoder = new TextEncoder();
const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const officeRelationships = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
const xml = (value = '') => Array.from(String(value)).filter((character) => { const code = character.codePointAt(0); return (code >= 32 || [9, 10, 13].includes(code)) && code !== 65534 && code !== 65535; }).join('').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);

const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  return value >>> 0;
});
const crc32 = (data) => {
  let crc = 0xffffffff;
  for (const byte of data) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
};

const zipFiles = (files) => {
  const parts = [];
  const directory = [];
  let offset = 0;
  for (const [name, value] of files) {
    const filename = encoder.encode(name);
    const data = typeof value === 'string' ? encoder.encode(value) : value;
    const crc = crc32(data);
    const header = new Uint8Array(30 + filename.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(12, 33, true); // 1980-01-01, a valid DOS date.
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, filename.length, true);
    header.set(filename, 30);
    parts.push(header, data);
    const entry = new Uint8Array(46 + filename.length);
    const central = new DataView(entry.buffer);
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x0800, true);
    central.setUint16(14, 33, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, data.length, true);
    central.setUint32(24, data.length, true);
    central.setUint16(28, filename.length, true);
    central.setUint32(42, offset, true);
    entry.set(filename, 46);
    directory.push(entry);
    offset += header.length + data.length;
  }
  const directoryLength = directory.reduce((total, entry) => total + entry.length, 0);
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, files.length, true);
  view.setUint16(10, files.length, true);
  view.setUint32(12, directoryLength, true);
  view.setUint32(16, offset, true);
  return [...parts, ...directory, end];
};

const runXml = (run, relationships) => {
  if (run.image) {
    const { id, width, height, alt = 'Ảnh' } = run.image;
    const cx = Math.round(width * 9525);
    const cy = Math.round(height * 9525);
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Ảnh ${id}" descr="${xml(alt)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="image${id}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="image${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  }
  const properties = [run.bold && '<w:b/>', run.italic && '<w:i/>', run.underline && '<w:u w:val="single"/>', run.strike && '<w:strike/>', /^[0-9a-f]{6}$/i.test(run.color || '') && `<w:color w:val="${run.color}"/>`, Number.isFinite(run.size) && `<w:sz w:val="${Math.round(Math.min(144, Math.max(8, run.size)) * 2)}"/>`].filter(Boolean).join('');
  const text = String(run.text || '').split(/\r?\n/).map((line) => `<w:t xml:space="preserve">${xml(line)}</w:t>`).join('<w:br/>');
  const result = `<w:r>${properties ? `<w:rPr>${properties}</w:rPr>` : ''}${run.break ? '<w:br/>' : text}</w:r>`;
  if (run.href && /^(https?:\/\/|mailto:)/i.test(run.href)) {
    const id = `link${relationships.length + 1}`;
    relationships.push(`<Relationship Id="${id}" Type="${officeRelationships}hyperlink" Target="${xml(run.href)}" TargetMode="External"/>`);
    return `<w:hyperlink r:id="${id}">${result}</w:hyperlink>`;
  }
  return result;
};

const paragraphXml = (paragraph, relationships) => {
  const properties = [paragraph.style && `<w:pStyle w:val="${xml(paragraph.style)}"/>`, paragraph.listId && `<w:numPr><w:ilvl w:val="${Math.min(8, paragraph.depth || 0)}"/><w:numId w:val="${paragraph.listId}"/></w:numPr>`, paragraph.indent && `<w:ind w:left="${Math.min(6000, Math.max(0, paragraph.indent))}"/>`, ['left', 'center', 'right', 'justify'].includes(paragraph.align) && `<w:jc w:val="${paragraph.align === 'justify' ? 'both' : paragraph.align}"/>`].filter(Boolean).join('');
  return `<w:p>${properties ? `<w:pPr>${properties}</w:pPr>` : ''}${paragraph.runs.map((run) => runXml(run, relationships)).join('')}</w:p>`;
};

export const createWordPackage = ({ title, paragraphs = [], images = [], lists = [] }) => {
  const relationships = [
    `<Relationship Id="styles" Type="${officeRelationships}styles" Target="styles.xml"/>`,
    `<Relationship Id="numbering" Type="${officeRelationships}numbering" Target="numbering.xml"/>`,
    ...images.map((image) => `<Relationship Id="image${image.id}" Type="${officeRelationships}image" Target="media/image${image.id}.png"/>`),
  ];
  const document = declaration + `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="${officeRelationships.slice(0, -1)}" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${paragraphXml({ style: 'Title', runs: [{ text: title || 'Không tiêu đề' }] }, relationships)}${paragraphs.map((paragraph) => paragraphXml(paragraph, relationships)).join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const styles = declaration + '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:sz w:val="24"/><w:lang w:val="vi-VN"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="280"/></w:pPr><w:rPr><w:b/><w:sz w:val="40"/><w:color w:val="000000"/></w:rPr></w:style>' + [1, 2, 3].map((level) => `<w:style w:type="paragraph" w:styleId="Heading${level}"><w:name w:val="heading ${level}"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="${level - 1}"/></w:pPr><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="${36 - level * 4}"/></w:rPr></w:style>`).join('') + '</w:styles>';
  const numbering = declaration + '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' + ['bullet', 'decimal'].map((type, index) => `<w:abstractNum w:abstractNumId="${index}"><w:multiLevelType w:val="multilevel"/>${Array.from({ length: 9 }, (_, level) => `<w:lvl w:ilvl="${level}"><w:start w:val="1"/><w:numFmt w:val="${type}"/><w:lvlText w:val="${type === 'bullet' ? '•' : `%${level + 1}.`}"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="${720 * (level + 1)}"/></w:tabs><w:ind w:left="${720 * (level + 1)}" w:hanging="360"/></w:pPr></w:lvl>`).join('')}</w:abstractNum>`).join('') + lists.map((list) => `<w:num w:numId="${list.id}"><w:abstractNumId w:val="${list.type === 'decimal' ? 1 : 0}"/><w:lvlOverride w:ilvl="${list.depth || 0}"><w:startOverride w:val="${list.start || 1}"/></w:lvlOverride></w:num>`).join('') + '</w:numbering>';
  const files = [
    ['[Content_Types].xml', declaration + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>'],
    ['_rels/.rels', declaration + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="document" Type="${officeRelationships}officeDocument" Target="word/document.xml"/></Relationships>`],
    ['word/document.xml', document],
    ['word/styles.xml', styles],
    ['word/numbering.xml', numbering],
    ['word/_rels/document.xml.rels', declaration + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships.join('')}</Relationships>`],
    ...images.map((image) => [`word/media/image${image.id}.png`, image.bytes]),
  ];
  return new Blob(zipFiles(files), { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
};
