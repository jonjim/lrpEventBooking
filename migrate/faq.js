const mssql = require('mssql');
const FAQ = require('../models/faq');

module.exports = async function importFAQ() {
    let faqs = await FAQ.find(); 
    console.log('Parsing FAQS');
    let counter = 0;
    if (faqs) {
        for (faq of faqs) {
            try {
                const request = new mssql.Request()
                    .input('legacyId', mssql.VarChar, faq._id)
                    .input('question', mssql.Text, faq.question)
                    .input('answer', mssql.Text, faq.answer)
                    .input('display', mssql.Bit, faq.display ? 1 : 0);
                const result = await request.query`INSERT INTO faqs (legacyId, question, answer, display) OUTPUT INSERTED.Id VALUES (@legacyId,@question,@answer,@display)`;
                const faqId = result.recordset[0].Id;
                console.log("   Inserted FAQ ID: " + faqId);
                counter++;
            }
            catch (error) {
                if (error.message.includes('duplicate key')) {
                    console.log(`   FAQ entry already exists`);
                }
                else
                console.log(error.message);
            }
        }
        console.log(`Imported ${counter} of ${faqs.length} FAQ`);
    }
}
