import { CacheType, ChannelType, ChatInputCommandInteraction, EmbedBuilder, OverwriteResolvable, SlashCommandBuilder } from 'discord.js';
import { prisma } from '../../lib/prisma';
import { hasDuplicates } from '../../lib/utils';
import SlashCommand from '../../templates/SlashCommand';
import { ENV } from '../../lib/env';

const ephemeral = false;

async function createTeam(interaction: ChatInputCommandInteraction<CacheType>) {
  const teamName = interaction.options.getString('name', true);
  const secondMember = interaction.options.getUser('2nd_member', true);
  const thirdMember = interaction.options.getUser('3rd_member', true);
  const fourthMember = interaction.options.getUser('4th_member', true);

  const guild = interaction.guild;

  if (!guild) {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle('Guild Not Found')
      .setDescription('This command can only be used in a server.');

    return interaction.reply({
      embeds: [embed],
      ephemeral
    });
  }

  if (hasDuplicates([interaction.user.id, secondMember.id, thirdMember.id, fourthMember.id])) {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle('Duplicate Members !')
      .setDescription('You cannot create a team with duplicate members. You need 4 unique members to create a team. (You are the 1st member)');

    return interaction.reply({
      embeds: [embed],
      ephemeral
    });
  }

  const leader = await prisma.member.findUnique({ where: { id: interaction.user.id }, include: { team: true } });

  if (leader?.team) {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle('You are already in a Team !')
      .setDescription(`You are already in a team: **${leader.team.name}**.`);

    return interaction.reply({
      embeds: [embed],
      ephemeral
    });
  }

  const existingTeam = await prisma.team.findUnique({ where: { name: teamName } });

  if (existingTeam) {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle('Team Name Already Taken !')
      .setDescription(`The team name **${teamName}** is already taken. Please choose a different name.`);

    return interaction.reply({
      embeds: [embed],
      ephemeral
    });
  }

  const teamMembers = [interaction.user, secondMember, thirdMember, fourthMember];

  const alreadyInTeam = []

  for (const member of teamMembers) {
    const dbMember = await prisma.member.findUnique({ where: { id: member.id }, include: { team: true } });

    if (dbMember?.team)
      alreadyInTeam.push({ member, team: dbMember.team.name });
  }

  if (alreadyInTeam.length) {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle('Member Already in a Team !')
      .setDescription(`The following members are already in a team:\n${alreadyInTeam.map(m => `- <@${m.member.id}> (Team: **${m.team}**)`).join('\n')}`);

    return interaction.reply({
      embeds: [embed],
      ephemeral
    });
  }

  const moderatorPerms: OverwriteResolvable = {
    id: ENV.MODERATOR_ROLE_ID,
    allow: [
      "ManageChannels",
      "ManageRoles",
      "ViewChannel",
      "ManageMessages",
      "MentionEveryone",
      "ManageThreads",
    ],
  }

  const leaderPerms: OverwriteResolvable = {
    id: interaction.user.id,
    allow: [
      'ManageChannels',
      'ViewChannel',
      'UseEmbeddedActivities',
      'UseExternalApps',
      'ReadMessageHistory',
      'MentionEveryone',
      'ManageThreads',
      'CreatePublicThreads',
      'CreatePrivateThreads',
    ],
    deny: [
      'CreateInstantInvite',
      'UseExternalEmojis',
      'UseExternalStickers',
    ]
  }

  const memberPerms: OverwriteResolvable = {
    id: "",
    allow: [
      'ViewChannel',
      'UseEmbeddedActivities',
      'UseExternalApps',
      'ReadMessageHistory',
      'MentionEveryone',
      'CreatePublicThreads',
      'CreatePrivateThreads',
    ],
    deny: [
      'CreateInstantInvite',
      'UseExternalEmojis',
      'UseExternalStickers',
    ]
  }

  const everyonePerms: OverwriteResolvable = {
    id: guild.id,
    allow: [],
    deny: [
      'ViewChannel',
    ]
  }

  const category = await interaction.guild?.channels.create({
    name: teamName, type: ChannelType.GuildCategory, permissionOverwrites: [
      moderatorPerms,
      leaderPerms,
      {
        ...memberPerms,
        id: secondMember.id,
      },
      {
        ...memberPerms,
        id: thirdMember.id,
      },
      {
        ...memberPerms,
        id: fourthMember.id,
      },
      everyonePerms
    ]
  })

  if (!category) {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle('Error Creating Category')
      .setDescription('An error occurred while trying to create the team category. Please try again later.');

    return interaction.reply({
      embeds: [embed],
      ephemeral
    });
  }

  try {
    for (const member of teamMembers) {
      await prisma.member.upsert({
        where: { id: member.id },
        update: {},
        create: {
          id: member.id,
          username: member.username
        }
      })
    }

    await prisma.team.create({
      data: {
        name: teamName,
        leader: { connect: { id: interaction.user.id } },
        members: {
          connect: teamMembers.map(member => ({ id: member.id }))
        },
        categoryId: category.id
      }
    });
  } catch (error) {
    console.error('Error creating team:', error);
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle('Error Creating Team')
      .setDescription('An error occurred while trying to create the team. Please try again later.');

    return interaction.reply({
      embeds: [embed],
      ephemeral
    });
  }

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle('Team Created Successfully!')
    .setDescription(`Your team **${teamName}** has been created successfully!\nMembers:\n- <@${interaction.user.id}> (Leader)\n- <@${secondMember.id}>\n- <@${thirdMember.id}>\n- <@${fourthMember.id}>\n\nA new category has been created for your team: **${teamName}**. As the team leader, you can manage your team channels there.`);

  return interaction.reply({
    embeds: [embed],
    ephemeral
  });
}

async function viewTeam(interaction: ChatInputCommandInteraction<CacheType>) {
  const member = interaction.options.getUser('member') || interaction.user;

  if (member.id !== interaction.user.id && !interaction.memberPermissions?.has('ManageGuild')) {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle('Permission Denied')
      .setDescription(`You do not have permission to view another member's team information.`);

    return interaction.reply({
      embeds: [embed],
      ephemeral
    });
  }

  const dbMember = await prisma.member.findUnique({
    where: { id: member.id },
    include: { team: { include: { members: true } } }
  });

  if (!dbMember?.team) {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle('No Team Found')
      .setDescription(member.id === interaction.user.id ? `You are not in a team.` : `<@${member.id}> is not in a team.`);

    return interaction.reply({
      embeds: [embed],
      ephemeral
    });
  }

  const team = dbMember.team;

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setTitle(`Team Information`)
    .setDescription(`Team Name: **${team.name}**\nMembers:\n- <@${team.leaderId}> (Leader)\n${team.members.filter(m => m.id !== team.leaderId).map(m => `- <@${m.id}>`).join('\n')}`);

  return interaction.reply({
    embeds: [embed],
    ephemeral
  });
}

async function disbandTeam(interaction: ChatInputCommandInteraction<CacheType>) {
  const teamName = interaction.options.getString('name', true);

  const guild = interaction.guild;

  if (!guild) {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle('Guild Not Found')
      .setDescription('This command can only be used in a server.');

    return interaction.reply({
      embeds: [embed],
      ephemeral
    });
  }

  if (!interaction.memberPermissions?.has('ManageGuild')) {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle('Permission Denied')
      .setDescription(`You do not have permission to disband a team.`);

    return interaction.reply({
      embeds: [embed],
      ephemeral
    });
  }

  const dbTeam = await prisma.team.findUnique({
    where: { name: teamName },
    include: { members: true }
  });

  if (!dbTeam) {
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle('Team Not Found')
      .setDescription(`The team **${teamName}** does not exist.`);

    return interaction.reply({
      embeds: [embed],
      ephemeral
    });
  }

  const category = await interaction.guild?.channels.fetch(dbTeam.categoryId);

  if (category) {
    const childrenChannels = guild.channels.cache.filter(c => c.parentId === category.id);

    for (const channel of childrenChannels.values())
      await channel.delete();

    await category.delete();
  }

  try {
    await prisma.team.delete({
      where: { name: teamName }
    });

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle('Team Disbanded Successfully')
      .setDescription(`The team **${teamName}** has been disbanded successfully.`);

    return interaction.reply({
      embeds: [embed],
      ephemeral
    });
  } catch (error) {
    console.error('Error disbanding team:', error);
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle('Error Disbanding Team')
      .setDescription('An error occurred while trying to disband the team. Please try again later.');

    return interaction.reply({
      embeds: [embed],
      ephemeral
    });
  }
}

export default new SlashCommand({
  data: new SlashCommandBuilder()
    .setName('team')
    .setDescription('team-related commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('create a team')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('name of the team')
            .setRequired(true)
        )
        .addUserOption(option =>
          option
            .setName('2nd_member')
            .setDescription('2nd member of the team')
            .setRequired(true)
        )
        .addUserOption(option =>
          option
            .setName('3rd_member')
            .setDescription('3rd member of the team')
            .setRequired(true)
        )
        .addUserOption(option =>
          option
            .setName('4th_member')
            .setDescription('4th member of the team')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('view your team information')
        .addUserOption(option =>
          option
            .setName('member')
            .setDescription('the member to view the team of (default: yourself)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('disband')
        .setDescription('disband a team')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('name of the team to disband')
            .setRequired(true)
        )
    ),
  execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    const subCommands = {
      create: createTeam,
      view: viewTeam,
      disband: disbandTeam
    }

    return subCommands[subcommand as keyof typeof subCommands](interaction)
  }
});
