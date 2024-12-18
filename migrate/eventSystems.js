const mssql = require('mssql');
const EventSystems = require('../models/eventSystems');
const { insertImage, insertCustomField } = require('./utils.js');

const lorienTrustFields = {
    characterSkillsId: undefined,
    occupationalSkillsId: undefined,
    characterName: undefined,
    faction: undefined,
    race: undefined,
    playerId: undefined,
    refMarshal: undefined,
    claw: undefined,
    bow: undefined,
    marketing: undefined,
}

const eldritchDaysFields = {
    characterName: undefined,
    playerId: undefined,
    marketing: undefined,
}

const jaegerFields = {
    characterName: undefined,
    preferredName: undefined,
    pronouns: undefined,
    bunkPreference: undefined,
    bunkConfirmation: undefined,
    accessibilityNeeds: undefined,
    promotionalPhotoConsent: undefined,
    module1: undefined,
    module2: undefined,
    module3: undefined,
    backstory: undefined,
    nationOfOrigin: undefined,
    background: undefined,
    jaegerhaus: undefined,
    doYouRequireAWristband: undefined,
    icPronouns: undefined,
    marketing: undefined,
}

const jadeThroneFields = {
    characterName: undefined,
    marketing: undefined,
}

const twistedTalesFields = {
    characterName: undefined,
    marketing: undefined,
}



module.exports = async function importEventSystems() {
    let eventSystems = await EventSystems.find();
    console.log('Importing event systems');
    let counter = 0;
    for (eventSystem of eventSystems) {
        try {
            const img = eventSystem?.img.url ? await insertImage(eventSystem.img.url, eventSystem.img.filename) : null;
            const request = new mssql.Request()
                .input('legacyId', mssql.VarChar, eventSystem._id)
                .input('name', mssql.VarChar, eventSystem.name)
                .input('description', mssql.Text, eventSystem.description)
                .input('imgId', mssql.Int, img)
                .input('website', mssql.VarChar, eventSystem.website)
                .input('facebook', mssql.VarChar, eventSystem.facebook)
                .input('twitter', mssql.VarChar, eventSystem.twitter)
                .input('instagram', mssql.VarChar, eventSystem.instagram)
                .input('discord', mssql.VarChar, eventSystem.discord)
                .input('tiktok', mssql.VarChar, eventSystem.tiktok)
                .input('whatsapp', mssql.VarChar, eventSystem.whatsapp)
                .input('snapchat', mssql.VarChar, eventSystem.snapchat)
                .input('terms', mssql.Text, eventSystem.terms)
                .input('systemRef', mssql.VarChar, eventSystem.systemRef)
                .input('active', mssql.Bit, eventSystem.active ? 1 : 0)
                .input('sanctioningFee', mssql.Float, eventSystem.sanctioningFee)
                .input('webhookDiscord', mssql.VarChar, eventSystem.webhooks.discord);
            const result = await request.query`INSERT INTO event_systems (legacyId, name, description, imgId, website, facebook, twitter, instagram, discord,tiktok,whatsapp,snapchat,terms,systemRef,active,sanctioningFee,webhookDiscord) OUTPUT INSERTED.Id VALUES (@legacyId,@name,@description,@imgId,@website,@facebook,@twitter,@instagram,@discord,@tiktok,@whatsapp,@snapchat,@terms,@systemRef,@active,@sanctioningFee,@webhookDiscord)`;
            const eventSystemId = result.recordset[0].Id;
            console.log("   Inserted Event System " + eventSystem.name);
            eventSystem.customFields.push({
                label: 'Character Name',
                name: 'characterName',
                type: 'text',
                required: true,
                section: 'character',
                description: 'Your character name',
                error: 'A character name is required!',
                display: true
            });
            eventSystem.customFields.push({
                label: 'Marketing',
                name: 'marketing',
                type: 'text',
                required: false,
                section: 'player',
                description: '',
                error: '',
                display: true
            });
            if (eventSystem.systemRef == 'lorienTrust') {
                eventSystem.customFields.push({
                    label: 'Lorien Trust Access Token',
                    name: 'authCode',
                    type: 'text',
                    required: false,
                    section: 'player',
                    description: '<p>This code can be obtained from your account on the <a href="https://www.lorientrust.com">Lorien Trust Website</a></p><p>It is not required, and is not shared with event organisers.</p>',
                    display: true
                });
                eventSystem.customFields.push({
                    label: 'Character Skills',
                    name: 'characterSkills',
                    type: 'array',
                    required: false,
                    section: 'character',
                    description: '',
                    display: true
                });
                eventSystem.customFields.push({
                    label: 'Occupational Skills',
                    name: 'occupationalSkills',
                    type: 'array',
                    required: false,
                    section: 'character',
                    description: '',
                    display: true
                });
            }
            console.log('       Parsing custom fields for ' + eventSystem.name);
            if (eventSystem.customFields) {
                for (field of eventSystem.customFields) {
                    try {
                        const customFieldsRequest = new mssql.Request()
                            .input('legacyId', mssql.VarChar, field._id)
                            .input('eventSystemId', mssql.Int, eventSystemId)
                            .input('label', mssql.VarChar, field.label)
                            .input('name', mssql.VarChar, field.name)
                            .input('type', mssql.VarChar, field.type ?? 'text')
                            .input('required', mssql.Bit, field.required ? 1 : 0)
                            .input('section', mssql.VarChar, field.section)
                            .input('defaultValue', mssql.VarChar, field.defaultValue)
                            .input('description', mssql.Text, field.description)
                            .input('placeholder', mssql.VarChar, field.placeholder)
                            .input('error', mssql.Text, field.error)
                            .input('display', mssql.Bit, field.display ? 1 : 0)
                        const customFieldResult = await customFieldsRequest.query`INSERT INTO custom_fields (legacyId,eventSystemId,label,name,type,required,section,defaultValue,description,placeholder,error,display) OUTPUT INSERTED.Id VALUES (@legacyId,@eventSystemId,@label,@name,@type,@required,@section,@defaultValue,@description,@placeholder,@error,@display)`

                        const fieldId = customFieldResult.recordset[0].Id;
                        if (eventSystem.systemRef == 'lorienTrust') {
                            if (field.name == 'characterName') lorienTrustFields.characterName = fieldId;
                            if (field.name == 'characterSkills') lorienTrustFields.characterSkillsId = fieldId;
                            if (field.name == 'occupationalSkills') lorienTrustFields.occupationalSkillsId = fieldId;
                            if (field.name == 'faction') lorienTrustFields.faction = fieldId;
                            if (field.name == 'race') lorienTrustFields.race = fieldId;
                            if (field.name == 'playerId') lorienTrustFields.playerId = fieldId;
                            if (field.name == 'refereeMarshalNumber') lorienTrustFields.refMarshal = fieldId;
                            if (field.name == 'clawCompetency') lorienTrustFields.claw = fieldId;
                            if (field.name == 'bowCompetency') lorienTrustFields.bow = fieldId;
                            if (field.name == 'marketing') lorienTrustFields.marketing = fieldId;
                        }

                        if (eventSystem.systemRef == 'eldritchDays') {
                            if (field.name == 'characterName') eldritchDaysFields.characterName = fieldId;
                            if (field.name == 'playerId') eldritchDaysFields.playerId = fieldId;
                            if (field.name == 'marketing') eldritchDaysFields.marketing = fieldId;
                        }

                        if (eventSystem.systemRef == 'jadeThrone') {
                            if (field.name == 'characterName') jadeThroneFields.characterName = fieldId;
                            if (field.name == 'marketing') jadeThroneFields.marketing = fieldId;
                        }

                        if (eventSystem.systemRef == 'twistedTales') {
                            if (field.name == 'characterName') twistedTalesFields.characterName = fieldId;
                            if (field.name == 'marketing') twistedTalesFields.marketing = fieldId;
                        }

                        if (eventSystem.systemRef == 'jaegerLarp') {
                            if (field.name == 'characterName') jaegerFields.characterName = fieldId;
                            if (field.name == 'module') {
                                if (field.label == "module 1") jaegerFields.module1 = fieldId;
                                if (field.label == "module 2") jaegerFields.module2 = fieldId;
                                if (field.label == "module 3") jaegerFields.module3 = fieldId;
                            }
                            if (field.name == 'marketing') jaegerFields.marketing = fieldId;
                            if (field.name == 'preferredName') jaegerFields.preferredName = fieldId;
                            if (field.name == 'pronouns') jaegerFields.pronouns = fieldId;
                            if (field.name == 'bunkPreference') jaegerFields.bunkPreference = fieldId;
                            if (field.name == 'accessibilityNeeds') jaegerFields.accessibilityNeeds = fieldId;
                            if (field.name == 'promotionalPhotoConsent') jaegerFields.promotionalPhotoConsent = fieldId;
                            if (field.name == 'backstory') jaegerFields.backstory = fieldId;
                            if (field.name == 'nationofOrigin') jaegerFields.nationOfOrigin = fieldId;
                            if (field.name == 'jaegerhaus') jaegerFields.jaegerhaus = fieldId;
                            if (field.name == 'doYouRequireAWristband') jaegerFields.doYouRequireAWristband = fieldId;
                            if (field.name == 'icPronouns') jaegerFields.icPronouns = fieldId;
                        }
                        if (field.options.length > 0) {
                            for (fieldOption of field.options) {
                                try {
                                    const optionsRequest = new mssql.Request()
                                        .input('customFieldId', mssql.Int, fieldId)
                                        .input('fieldOption', mssql.VarChar, fieldOption.trim());
                                    const optionsResult = await optionsRequest.query`INSERT INTO custom_fields_options (customFieldId,fieldOption) OUTPUT INSERTED.Id VALUES (@customFieldId,@fieldOption)`;
                                    const optionId = optionsResult.recordset[0].Id;
                                }
                                catch (error) {
                                    console.log(error.message);
                                }
                            }
                        }
                    }
                    catch (error) {
                        console.log(error.message);
                    }
                }
                if (eventSystem.systemRef == 'lorienTrust') {
                    const customFieldsRequest = new mssql.Request()
                        .input('eventSystemId', mssql.Int, eventSystemId)
                        .input('label', mssql.VarChar, 'Character Skill Name')
                        .input('name', mssql.VarChar, 'characterSkill')
                        .input('type', mssql.VarChar, 'text')
                        .input('required', mssql.Bit, 0)
                        .input('section', mssql.VarChar, 'character')
                        .input('defaultValue', mssql.VarChar, '')
                        .input('description', mssql.Text, '')
                        .input('placeholder', mssql.VarChar, '')
                        .input('error', mssql.Text, '')
                        .input('display', mssql.Bit, 1)
                        .input('parent_fieldId', mssql.Int, characterSkills)
                    const customFieldResult = await customFieldsRequest.query`INSERT INTO custom_fields (eventSystemId,label,name,type,required,section,defaultValue,description,placeholder,error,display,parent_fieldId) OUTPUT INSERTED.Id VALUES (@eventSystemId,@label,@name,@type,@required,@section,@defaultValue,@description,@placeholder,@error,@display,@parent_fieldId)`
                }
                if (eventSystem.systemRef == 'lorienTrust') {
                    const customFieldsRequest = new mssql.Request()
                        .input('eventSystemId', mssql.Int, eventSystemId)
                        .input('label', mssql.VarChar, 'Occupational Skill Name')
                        .input('name', mssql.VarChar, 'occupationalSkill')
                        .input('type', mssql.VarChar, 'text')
                        .input('required', mssql.Bit, 0)
                        .input('section', mssql.VarChar, 'character')
                        .input('defaultValue', mssql.VarChar, '')
                        .input('description', mssql.Text, '')
                        .input('placeholder', mssql.VarChar, '')
                        .input('error', mssql.Text, '')
                        .input('display', mssql.Bit, 1)
                        .input('parent_fieldId', mssql.Int, occupationalSkills)
                    const customFieldResult = await customFieldsRequest.query`INSERT INTO custom_fields (eventSystemId,label,name,type,required,section,defaultValue,description,placeholder,error,display,parent_fieldId) OUTPUT INSERTED.Id VALUES (@eventSystemId,@label,@name,@type,@required,@section,@defaultValue,@description,@placeholder,@error,@display,@parent_fieldId)`
                }
            }
            counter++;
        }
        catch (error) {
            if (error.message.includes('duplicate key')) {
                console.log(`   ${eventSystem.name} already exists`);
            }
            else 
            console.log(error.message)
        }
    }
    console.log(`Imported ${counter} of ${eventSystems.length} event systems`);
    return {
        lorienTrustFields: lorienTrustFields,
        jaegerFields: jaegerFields,
        jadeThroneFields: jadeThroneFields,
        eldritchDaysFields: eldritchDaysFields,
        twistedTalesFields: twistedTalesFields
    }
}