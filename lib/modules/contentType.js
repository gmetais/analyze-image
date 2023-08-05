const debug = require("debug")("analyze-image:contentType"),
  FileType = require("file-type"),
  isSvg = require("is-svg");


async function main(analyzer) {
  const content = analyzer.image;
  let buffer, str;

  // Can be:
  //  - a string based image such as SVG
  //  - a base64 encoded binary image
  //  - a binary image buffer
  //  - a string based image inside a buffer
  // Let's check all of these.
  if (typeof content === "string") {
    str = content;
    buffer = Buffer.from(content, "base64");
  } else if (Buffer.isBuffer(content)) {
    buffer = content;
    str = content.toString();
  }

  if (/<svg/.test(str) && isSvg(str)) {
    debug("Detected file type is svg (image/svg+xml)");
    analyzer.body = str;
    return {
      format: "svg",
      mimeType: "image/svg+xml",
      weight: str.length
    };
  }

  const type = await FileType.fromBuffer(buffer);
  if (type) {
    debug("Detected file type is %s (%s)", type.ext, type.mime);
    
    if (["svg", "jpg", "png", "gif", "webp", "avif"].includes(type.ext)) {
      analyzer.body = buffer;
      return {
        format: type.ext,
        mimeType: type.mime,
        weight: buffer.length
      };
    } else {
      debug("Unsupported image format %s", type.ext);
    }
  } else {
    debug("Unable to detect file type");
  }

  analyzer.body = undefined;
  return {
    format: undefined,
    mimeType: undefined,
    weight: content.length
  };
}

main.description = "Detects the content type";
module.exports = main;