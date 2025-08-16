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
                    .input('question', mssql.VarChar, faq.question)
                    .input('answer', mssql.VarChar, faq.answer)
                    .input('display', mssql.Bit, faq.display ? 1 : 0);
                const faqLookup = await request.query`SELECT [FaqID] FROM [Website].[Dat_Faqs] WHERE [Question]=@Question`;

                if (faqLookup.rowsAffected < 1){
                    const result = await request.query`INSERT INTO [Website].[Dat_Faqs] (Question, Answer, Display) OUTPUT INSERTED.FaqID VALUES (@question,@answer,@display)`;
                    const faqId = result.recordset[0].FaqID;
                    console.log("   Inserted FAQ ID: " + faqId + ' - ' + faq.question);
                    counter++;
                }
                else{
                    const request = new mssql.Request()
                        .input('faqId', mssql.Int, faqLookup.recordset[0].FaqID)
                        .input('answer', mssql.VarChar, faq.answer)
                        .input('display', mssql.Bit, faq.display ? 1 : 0);
                    const result = await request.query`UPDATE [Website].[Dat_Faqs] SET [Answer]=@answer, [Display]=@display WHERE [FaqID]=@faqId`;
                    console.log("   Updated FAQ ID: " + faqLookup.recordset[0].FaqID + ' - ' + faq.question);
                    counter++;
                }
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
