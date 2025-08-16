const mssql = require('mssql');

async function insertImage(url, filename) {    
    const fileLookup = await mssql.query`SELECT [ImageID] FROM [Images].[Dat_Images] WHERE [Url]='${url}'`
    if (fileLookup.rowsAffected < 1){
    const request = new mssql.Request()
        .input('filename', mssql.VarChar, filename)
        .input('url', mssql.VarChar, url);
    
    const result = await request.query`INSERT INTO [Images].[Dat_Images] (Filename, Url) OUTPUT INSERTED.ImageID VALUES (@filename,@url)`;
    const imageId = result.recordset[0].ImageID;
    return imageId;
    }
    else{
        console.log(`   Image has already been inserted: ${url}`)
    }
}

 async function insertCustomField(user, characterSkillField, value) {
     try {
         if (value) {
             const request = new mssql.Request()
                 .input('userId', mssql.Int, user)
                 .input('CustomFieldId', mssql.Int, characterSkillField)
                 .input('Value', mssql.VarChar, value.toString())
             const result = await request.query`INSERT INTO [Users].[Lnk_User_Custom_Fields] ([AccountId],CustomFieldId,Value) VALUES (@userId,@CustomFieldId,@value)`;
             return result.recordset[0].CustomFieldId
         }
    }
    catch (error) {
        console.log({
            user: user,
            field: characterSkillField,
            value: value
        })
        console.log(error.message);
    }
}

async function importPageContent(title,content) {
    try {
        const pageLookup = await mssql.query`SELECT [PageID] FROM [Website].[Dat_Pages] WHERE [Title]='${title}'`
        if (pageLookup.rowsAffected < 1){
            let request = new mssql.Request()
                .input('created', mssql.DateTime, new Date())
                .input('modified', mssql.DateTime, new Date())
                .input('title', mssql.VarChar, title)
                .input('content', mssql.VarChar, content);
            let result = await request.query`INSERT INTO [Website].[Dat_Pages] (Created,Modified,Title,Content) OUTPUT INSERTED.PageID VALUES (@created,@modified,@title,@content)`;
            console.log("   Inserted content: " + title);
        }
        else{
            console.log(`   ${title} already exists`)
        }
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