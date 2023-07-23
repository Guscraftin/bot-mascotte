const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const {
    categoryVocals,channelMuted,
    roleMute, roleSeparator, roleVocal,
    vocalGeneral, vocalCourse, vocalSleep, vocalPanel
} = require(process.env.CONSTANT);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sync")
        .setDescription("🚧 Permet de synchroniser certains modules.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName("module")
                .setDescription("🚧 Module à synchroniser.")
                .addChoices(
                    { name: 'role_mute', value: 'role_mute' },
                    { name: 'vocals', value: 'vocals' },
                    { name: 'roles', value: 'roles' },
                )
                .setRequired(true)
        ),
    async execute(interaction) {
        const guild = interaction.guild;

        await interaction.deferReply({ ephemeral: true });

        let promises;
        switch (interaction.options.getString("module")) {
            /**
             * Sync permissions of the mute role
             */
            case "role_mute":
                const channels = await guild.channels.fetch();

                promises = channels.map(async (channel) => {
                    if (channel.id === channelMuted) {
                        await channel.permissionOverwrites.edit(roleMute, {
                            ViewChannel: true,
                            SendMessages: true,
                            SendMessagesInThreads: true,
                            CreatePublicThreads: true,
                            CreatePrivateThreads: true,
                            AddReactions: true,
                        });
                    } else {
                        await channel.permissionOverwrites.edit(roleMute, {
                            SendMessages: false,
                            SendMessagesInThreads: false,
                            CreatePublicThreads: false,
                            CreatePrivateThreads: false,
                            AddReactions: false,
                            Speak: false,
                        });
                    }
                });
                await Promise.all(promises);

                return interaction.editReply({ content: `Les permissions du rôle <@&${roleMute}> ont bien été synchroniser dans tous les salons notamment dans <#${channelMuted}>.`, ephemeral: true });


            /**
             * Sync vocals channels
             */
            case "vocals":
                const channelsNotDelete = [vocalGeneral, vocalCourse, vocalSleep, vocalPanel];

                const category = await guild.channels.fetch(categoryVocals);
                if (!category) return console.error("ready.js - La catégorie n'existe pas !");

                promises = await category.children.cache.map(async channel => {
                    if (channel.members.size === 0 && !channelsNotDelete.includes(channel.id)) {
                        await channel.delete();
                    }
                });
                await Promise.all(promises);

                return interaction.editReply({ content: `Les salons vocaux ont bien été synchroniser.`, ephemeral: true });


            /**
             * Sync roles (roleSeparator and roleVocal)
             */
            case "roles":
                const role = await guild.roles.fetch(roleVocal);
                if (!role) return;
                const members = await guild.members.fetch();

                promises = await members.map(async member => {
                    if (member.user.bot) return;

                    await member.roles.add(roleSeparator);
                    if (member.voice.channelId) await member.roles.add(role);
                    else await member.roles.remove(role);
                });
                await Promise.all(promises);

                return interaction.editReply({ content: `Les rôles ont bien été synchroniser.`, ephemeral: true });


            /**
             * DEFAULT
             */
            default:
                return interaction.editReply({ content: "🚧 Ce module n'existe pas. Contactez un administrateur.", ephemeral: true });
        }
    },
};