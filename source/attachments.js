const dataURIToBuffer = require("data-uri-to-buffer");
const parseDataURI = require("parse-data-uri");
const { ATTACHMENT_PREFIX, ATTACHMENT_REXP } = require("./symbols.js");

function extractAttachments(resultSet) {
    const results = Object.assign({}, resultSet);
    const attachments = [];
    const attachmentKeys = Object.keys(results).filter(key => ATTACHMENT_REXP.test(key));
    for (const attachmentKey of attachmentKeys) {
        const id = attachmentKey.replace(ATTACHMENT_PREFIX, "");
        const attachment = results[attachmentKey];
        attachment.id = id;
        const { data, mime } = attachment;
        if (/^text\//.test(mime)) {
            const { data: textBuffer } = parseDataURI(data);
            attachment.data = textBuffer.toString("utf8");
        } else {
            attachment.data = dataURIToBuffer(data);
        }
        attachments.push(attachment);
        delete results[attachmentKey];
    }
    return {
        results,
        attachments
    };
}

module.exports = {
    extractAttachments
};
