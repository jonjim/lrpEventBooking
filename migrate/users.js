const mssql = require('mssql');
const User = require('../models/user');
const { insertCustomField } = require('./utils.js');

module.exports = async function importUsers(systemFields) {
    const users = await User.find();
    console.log('Importing users');
    let counter = 0;
    for (user of users) {
        try {
            if (user.username) {
                const userRequest = new mssql.Request()
                    .input('legacyId', mssql.VarChar, user._id)
                    .input('email', mssql.NVarChar, user.username)
                    .input('firstname', mssql.VarChar, user.firstname)
                    .input('surname', mssql.VarChar, user.surname)
                    .input('role', mssql.VarChar, user.role)
                    .input('dob', mssql.Date, user.dob)
                    .input('emergencyContactName', mssql.VarChar, user.emergencyContactName)
                    .input('emergencyContactNumber', mssql.VarChar, user.emergencyContactNumber)
                    .input('emergencyContactRelation', mssql.VarChar, user.emergencyContactRelation)
                    .input('medicalInfo', mssql.Text, user.medicalInfo)
                    .input('allergyDietary', mssql.Text, user.allergyDietary)
                    .input('verificationCode', mssql.VarChar, user.verifyCode)
                    .input('resetPassword', mssql.VarChar, user.resetPassword)
                    .input('verified', mssql.Bit, user.verified ? 1 : 0)
                    .input('authString', mssql.VarChar, user.authString)
                    .input('googleId', mssql.VarChar, user.googleId)
                    .input('facebookId', mssql.VarChar, user.facebookId)
                    .input('displayBookings', mssql.Bit, user.displayBookings ? 1 : 0)
                    .input('dateCreated', mssql.DateTime, user.dateCreated)
                    .input('salt', mssql.Text, user.salt)
                    .input('hash', mssql.Text, user.hash);
                const userResponse = await userRequest.query`INSERT INTO users (legacyId,email,firstname,surname,role,dob,emergencyContactName,emergencyContactNumber,emergencyContactRelation,medicalInfo,allergyDietary,verificationCode,resetPassword,verified,authString,googleId,facebookId,displayBookings,dateCreated,salt,hash) OUTPUT INSERTED.Id VALUES (@legacyId,@email,@firstname,@surname,@role,@dob,@emergencyContactName,@emergencyContactNumber,@emergencyContactRelation,@medicalInfo,@allergyDietary,@verificationCode,@resetPassword,@verified,@authString,@googleId,@facebookId,@displayBookings,@dateCreated,@salt,@hash)`;
                const userId = userResponse.recordset[0].Id;
                console.log("   Inserted user: " + user.username);

                if (user.role === 'admin' || user.role === 'superAdmin') {
                    const permissionRequest = new mssql.Request()
                    .input('userId', mssql.Int, userId)
                    .input('permission', mssql.VarChar, user.role);
                    const permissionResponse = await permissionRequest.query`INSERT INTO users_permissions (userId,permission) VALUES (@userId,@permission)`;
                    const permissionResponse2 = await permissionRequest.query`INSERT INTO users_permissions (userId,permission) VALUES (@userId,'preview')`;
                    console.log("       Added user permission: " + user.role);
                    console.log("       Added user permission: preview");
                }

                if (user.eventHosts) {
                    user.eventHosts.forEach(async eventHost => {
                        const hostQuery = (await mssql.query`SELECT id, name FROM event_hosts WHERE legacyId=${eventHost._id}`).recordset[0];
                        const hostRequest = new mssql.Request()
                            .input('userId', mssql.Int, userId)
                            .input('eventHostId', mssql.Int, hostQuery.id);
                        const hostResult = await hostRequest.query`INSERT INTO users_event_hosts ([userId],eventHostId) OUTPUT INSERTED.Id VALUES (@userId,@eventHostId)`;
                        console.log(`       Added permission for user and event host: ${hostQuery.name}`);
                    });
                }
                if (user.eventSystems) {
                    user.eventSystems.forEach(async eventSystem => {
                        const systemQuery = (await mssql.query`SELECT id, name FROM event_systems WHERE legacyId=${eventSystem._id}`).recordset[0];
                        const systemRequest = new mssql.Request()
                            .input('userId', mssql.Int, userId)
                            .input('eventSystemId', mssql.Int, systemQuery.id);
                        const systemResult = await systemRequest.query`INSERT INTO users_event_systems ([userId],eventSystemId) OUTPUT INSERTED.Id VALUES (@userId,@eventSystemId)`;
                        console.log(`       Added permission for user and event system: ${systemQuery.name}`);
                    });
                }
            
                if (user.lorienTrust) {
                    if (user.lorienTrust.characterSkills)
                        user.lorienTrust.characterSkills.forEach(async skill => await insertCustomField(userId, systemFields.lorienTrustFields.characterSkillsId, skill.name));
                    if (user.lorienTrust.occupationalSkills)
                        user.lorienTrust.occupationalSkills.forEach(async skill => await insertCustomField(userId, systemFields.lorienTrustFields.occupationalSkillsId, skill.name));
                    await insertCustomField(userId, systemFields.lorienTrustFields.characterName, user.lorienTrust.character.characterName);
                    await insertCustomField(userId, systemFields.lorienTrustFields.faction, user.lorienTrust.character.faction);
                    await insertCustomField(userId, systemFields.lorienTrustFields.race, user.lorienTrust.character.race);
                    await insertCustomField(userId, systemFields.lorienTrustFields.playerId, user.lorienTrust.playerId);
                    await insertCustomField(userId, systemFields.lorienTrustFields.refMarshal, user.lorienTrust.refereeMarshalNumber);
                    await insertCustomField(userId, systemFields.lorienTrustFields.claw, user.lorienTrust.clawCompetency);
                    await insertCustomField(userId, systemFields.lorienTrustFields.bow, user.lorienTrust.bowCompetency);
                    await insertCustomField(userId, systemFields.lorienTrustFields.marketing, user.lorienTrust.marketing);
                }

                if (user.eldritchDays) {
                    await insertCustomField(userId, systemFields.eldritchDaysFields.characterName, user.eldritchDays.character.characterName);
                    await insertCustomField(userId, systemFields.eldritchDaysFields.marketing, user.eldritchDays.marketing);
                    await insertCustomField(userId, systemFields.eldritchDaysFields.playerId, user.eldritchDays.playerId);
                }

                if (user.jadeThrone) {
                    await insertCustomField(userId, systemFields.jadeThroneFields.characterName, user.jadeThrone.character.characterName);
                    await insertCustomField(userId, systemFields.jadeThroneFields.marketing, user.jadeThrone.marketing);
                }

                if (user.jaegerLarp) {
                    await insertCustomField(userId, systemFields.jaegerFields.characterName, user.jaegerLarp.character.characterName);
                    await insertCustomField(userId, systemFields.jaegerFields.marketing, user.jaegerLarp.marketing);
                    await insertCustomField(userId, systemFields.jaegerFields.preferredName, user.jaegerLarp.preferredName);
                    await insertCustomField(userId, systemFields.jaegerFields.nationOfOrigin, user.jaegerLarp.character.nationOfOrigin);
                    await insertCustomField(userId, systemFields.jaegerFields.background, user.jaegerLarp.character.background);
                    if (user.jaegerLarp.module) {
                        if (user.jaegerLarp.module.length >= 1)
                            await   insertCustomField(userId, systemFields.jaegerFields.module1, user.jaegerLarp.character.module[0]);
                        if (user.jaegerLarp.module.length >= 2)
                            await insertCustomField(userId, systemFields.jaegerFields.module2, user.jaegerLarp.character.module[1]);
                        if (user.jaegerLarp.module.length >= 3)
                            await insertCustomField(userId, systemFields.jaegerFields.module3, user.jaegerLarp.character.module[2]);
                    }
                    await insertCustomField(userId, systemFields.jaegerFields.jaegerhaus, user.jaegerLarp.character.jaegerhaus);
                    await insertCustomField(userId, systemFields.jaegerFields.backstory, user.jaegerLarp.character.backstory);
                    await insertCustomField(userId, systemFields.jaegerFields.icPronouns, user.jaegerLarp.character.icPronouns);
                    await insertCustomField(userId, systemFields.jaegerFields.pronouns, user.jaegerLarp.pronouns);
                    await insertCustomField(userId, systemFields.jaegerFields.doYouRequireAWristband, user.jaegerLarp.doYouRequireAWristband);
                    await insertCustomField(userId, systemFields.jaegerFields.bunkPreference, user.jaegerLarp.bunkPreference);
                    await insertCustomField(userId, systemFields.jaegerFields.accessibilityNeeds, user.jaegerLarp.accessibilityNeeds);
                    await insertCustomField(userId, systemFields.jaegerFields.promotionalPhotoConsent, user.jaegerLarp.promotionalPhotoConsent);
                    await insertCustomField(userId, systemFields.jaegerFields.bunkConfirmation, user.jaegerLarp.bunkConfirmation);
                }
            }
            counter++;
        }
        catch (error) {
            if (error.message.includes('duplicate key')) {
                console.log(`   ${user.username} already exists`);
            }
            else 
            console.log(error.message)   
        }
    }
    console.log(`Inserted ${counter} of ${users.length} users`);
}