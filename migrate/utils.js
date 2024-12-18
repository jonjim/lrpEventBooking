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

module.exports = { insertImage, insertCustomField }