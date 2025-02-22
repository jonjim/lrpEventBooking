const mssql = require('mssql');

async function insertImage(url, filename) {    
    const request = new mssql.Request()
        .input('filename', mssql.VarChar, filename)
        .input('url', mssql.VarChar, url);
    const result = await request.query`INSERT INTO images (filename, url) OUTPUT INSERTED.Id VALUES (@filename,@url)`;
    const imageId = result.recordset[0].Id;
    return imageId;
}

 async function insertCustomField(user, characterSkillField, value) {
     try {
         if (value) {
             const request = new mssql.Request()
                 .input('userId', mssql.Int, user)
                 .input('customFieldId', mssql.Int, characterSkillField)
                 .input('value', mssql.Text, value.toString())
             const result = await request.query`INSERT INTO users_custom_fields ([userId],customFieldId,value) OUTPUT Inserted.Id VALUES (@userId,@customFieldId,@value)`;
             return result.recordset[0].Id
         }
    }
    catch (error) {
        console.log(error.message);
    }
}

async function importPageContent(id,title,content) {
    try {
        let request = new mssql.Request()
            .input('created', mssql.DateTime, new Date())
            .input('modified', mssql.DateTime, new Date())
            .input('title', mssql.VarChar, title)
            .input('content', mssql.VarChar, content);
        let result = await request.query`INSERT INTO page_content (created, modified,title,content) OUTPUT INSERTED.Id VALUES (@created,@modified,@title,@content)`;
        console.log("Inserted content: " + title);
    }
    catch (error) {
        if (error.message.includes('duplicate key')) {
            console.log(`   Page content already exists`);
        }
        else
            console.log(error.message);
    }
}

module.exports = { insertImage, insertCustomField, importPageContent }