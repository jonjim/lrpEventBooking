const mssql = require('mssql');

module.exports = async function importPageContent(id,title,content) {
    try {
        let request = new mssql.Request()
            .input('id', mssql.Int, id)
            .input('created', mssql.DateTime, new Date())
            .input('modified', mssql.DateTime, new Date())
            .input('title', mssql.VarChar, title)
            .input('content', mssql.VarChar, content);
        let result = await request.query`INSERT INTO page_content (id,created, modified,title,content) OUTPUT INSERTED.Id VALUES (@id,@created,@modified,@title,@content)`;
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