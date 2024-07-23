const Discord = require("discord.js");
const config = require("./config.json"); 
const Enmap = require("enmap");

const client = new Discord.Client({
  allowedMentions: {
    parse: ["roles", "users"],
    repliedUser: false,
  },
  partials: ['MESSAGE', 'CHANNEL'],
  intents: [ 
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
  ],
});

client.settings = new Enmap({name: "settings"});

client.on("ready", () => {
    console.log(`[BOT] ${client.user.tag} aktif.`);
})

client.login(config.token)

client.on("messageCreate", async (message) => {
    if(!message.guild || message.author.bot) return;

    let args = message.content.slice(config.prefix.length).trim().split(" ");
    let cmd = args.shift()?.toLowerCase();

    if(!message.content.startsWith(config.prefix) || !cmd || cmd.length == 0) return;

   
    if(cmd == "kapat") {
        let TicketUserId = client.settings.findKey(d => d.channelId == message.channelId);

        if(!client.settings.has(TicketUserId)){
            return message.reply({
                content: `<:carpi_arviis:1046067681515814912> Bu kanal bir yazı kanalı değil.`
            })
        }
        client.settings.delete(TicketUserId);
        message.reply("<a:yukleniyor_arviis:1058007845364322354> Kanal `3 Saniye` içinde silinecek.");
        setTimeout(() => {
            message.channel.delete().catch(()=>{});
        }, 3000)
    }
    if(cmd == "kur") {
        let channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]); 
        if(!channel) return message.reply("<:carpi_arviis:1046067681515814912> Lütfen bir kanal etiketle.");
        
            let Menu = new Discord.MessageSelectMenu()
            .setCustomId("FirstTicketOpeningMenu")
            .setPlaceholder("Kategori Seç")
            .setMaxValues(1) 
            .setMinValues(1)
            .addOptions([ 
                {
                    label: "Genel Yardım".substr(0, 25), 
                    value: "genel_yardim".substr(0, 25),
                    description: "Yetkililerden genel yardım alabilirsin.".substr(0, 50),
                    emoji: "<:ampul_arviis:1052278328280764536>",
                },
                {
                    label: "Diğer Yardım".substr(0, 25),
                    value: "diger_yardim".substr(0, 25),
                    description: "Diğer yardımlar için destek alabilirsin.".substr(0, 50),
                    emoji: "<:bulut_arviis:1051904222150529094>",
                }
            ])
        let row = new Discord.MessageActionRow().addComponents(Menu);
        
        channel.send({
            embeds: [TicketEmbed],
            components: [row]
        }).then((msg) => {
            client.settings.set(message.guildId, channel.id, "TicketSystem1.channel")
            client.settings.set(message.guildId, msg.id, "TicketSystem1.message")
            client.settings.set(message.guildId, channel.parentId, "TicketSystem1.category")
            return message.reply("<:tik_arviis:1046067679884234863> Ticket sistemi başarıyla kuruldu.");
        }).catch((e) => {
            console.log(e);
            return message.reply("[HATA] Bazı sorunlarla karşılaşıldı.");
        })
    }
})

client.on("interactionCreate", async (interaction) => {
    if(!interaction.isSelectMenu() || !interaction.guildId || interaction.message.author.id != client.user.id) return
    
    client.settings.ensure(interaction.guildId, {
        TicketSystem1: {
            channel: "",
            message: "",
            category: "",
        }
    })

    let data = client.settings.get(interaction.guildId)
    if(!data.TicketSystem1.channel || data.TicketSystem1.channel.length == 0) return

    
    if(interaction.channelId == data.TicketSystem1.channel && interaction.message.id == data.TicketSystem1.message) {        
        switch(interaction.values[0]){
            case "genel_yardim": {
                let channel = await CreateTicket({
                    OpeningMessage: "<a:yukleniyor2_arviis:997607500746596412> Destek talebi oluşturuluyor...",
                    ClosedMessage: `<:tik_arviis:1046067679884234863> Destek Oluşturuldu: **(** <#{channelId}> **)**`,
                    embeds: [ 
                        new Discord.MessageEmbed()
                        .setColor("GREEN")
                        .setTitle("Hoş geldin! Sana nasıl yardımcı olabiliriz?")
                        .setImage("https://media.discordapp.net/attachments/1069639498637525043/1251982521718276137/ArviS1.png?ex=66a0add5&is=669f5c55&hm=dce81d162e544d974d6f85132c406853838155e2a64b9e3638dcaab1e975bed0&=&format=webp&quality=lossless&width=1422&height=592")
                    ]
                }).catch(e=>{
                    return console.log(e)
                })
               
            } break;
            case "diger_yardim": {
                let channel = await CreateTicket({
                    OpeningMessage: "<a:yukleniyor2_arviis:997607500746596412> Destek talebi oluşturuluyor...",
                    ClosedMessage: `<:tik_arviis:1046067679884234863> Destek Oluşturuldu: **(** <#{channelId}> **)**`,
                    embeds: [ 
                        new Discord.MessageEmbed()
                        .setColor("ORANGE")
                        .setTitle("Hoş geldin! Sana nasıl yardımcı olabiliriz?")
                        .setImage("https://media.discordapp.net/attachments/1069639498637525043/1251982521718276137/ArviS1.png?ex=66a0add5&is=669f5c55&hm=dce81d162e544d974d6f85132c406853838155e2a64b9e3638dcaab1e975bed0&=&format=webp&quality=lossless&width=1422&height=592")
                    ]
                }).catch(e=>{
                    return console.log(e)
                })
                console.log(channel.name);
            } break;
        }
        
        async function CreateTicket(ticketdata) {
            return new Promise(async function(resolve, reject) {
                await interaction.reply({
                    ephemeral: true,
                    content: ticketdata.OpeningMessage
                })
                let { guild } = interaction.message;
                let category = guild.channels.cache.get(data.TicketSystem1.category);
                if(!category || category.type != "GUILD_CATEGORY") category = interaction.message.channel.parentId || null; 
                let optionsData = {
                    type: "GUILD_TEXT",
                    topic: `${interaction.user.tag} | ${interaction.user.id}`,
                    permissionOverwrites: [],
                }
                if(client.settings.has(interaction.user.id)){
                    let TicketChannel = guild.channels.cache.get(client.settings.get(interaction.user.id, "channelId"))
                    if(!TicketChannel) {
                        client.settings.delete(interaction.user.id)
                    } else {
                        return interaction.editReply({
                            ephemeral: true,
                            content: `<:carpi_arviis:1046067681515814912> Zaten bir destek talebin mevcut! **(** <#${TicketChannel.id}> **)**`
                        })
                    }
                }
                optionsData.permissionOverwrites.push({
                    id: interaction.user.id,
                    type: "member",
                    allow: ["SEND_MESSAGES", "VIEW_CHANNEL", "EMBED_LINKS", "ADD_REACTIONS", "ATTACH_FILES"],
                    deny: [],
                })
                
                while (optionsData.permissionOverwrites.length >= 99){
                optionsData.permissionOverwrites.shift();
                }
                if(category) optionsData.parent = category;
                guild.channels.create(`ticket-${interaction.user.username.split(" ").join("-")}`.substr(0, 32), optionsData).then(async channel => {
                    await channel.send({
                        content: `<@${interaction.user.id}>`,
                        embeds: ticketdata.embeds
                    }).catch(()=>{});
                    client.settings.set(interaction.user.id, {
                        userId: interaction.user.id,
                        channelId: channel.id,
                    })
                    await interaction.editReply({
                        ephemeral: true,
                        content: ticketdata.ClosedMessage.replace("{channelId}", channel.id)
                    }).catch(()=>{});
                    resolve(channel);
                }).catch((e)=>{
                    reject(e)
                });
            })
            
        }

    } 
})