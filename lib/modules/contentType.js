import debugModule from 'debug';
const debug = debugModule('analyze-image:contentType');

import {fileTypeFromBuffer} from 'file-type';
import isSvg from 'is-svg';


async function main(runner) {
  const content = runner.image;
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
    
    // Save the body into the runner object
    runner.body = str;
    
    runner.addStat("format", "svg");
    runner.addStat("mimeType", "image/svg+xml");
    runner.addStat("fileSize", str.length);
    return;
  }

  const type = await fileTypeFromBuffer(buffer);
  if (type) {
    debug("Detected file type is %s (%s)", type.ext, type.mime);
    
    if (["svg", "jpg", "png", "gif", "webp", "avif"].includes(type.ext)) {
      
      // Save the body into the runner object
      runner.body = buffer;
      
      runner.addStat("format", type.ext);
      runner.addStat("mimeType", type.mime);
      runner.addStat("fileSize", buffer.length);

      // TODO: offender if wrong mime type?

      return;
    
    } else {
      debug("Unsupported image format %s", type.ext);
    }
  } else {
    debug("Unable to detect file type");
  }

  runner.body = undefined;
  
  runner.addStat("format", undefined);
  runner.addStat("mimeType", undefined);
  runner.addStat("weight", content.length);

}

export default main;
export const description = 'Detects the content type';
