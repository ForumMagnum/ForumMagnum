
import { registerMigration, fillDefaultValues } from './migrationUtils';
import { Tags } from '../../lib/collections/tags/collection';
import { newMutation } from '../vulcan-lib';
import Users from '../../lib/vulcan-users';

registerMigration({
  name: "createWikiImportUsers",
  dateWritten: "2020-09-03",
  idempotent: true,
  action: async () => {
    for (const username of newWikiUserNames) {
      await newMutation({
        collection: Users,
        document: {
          username,
          deleted: false,
          createdAt: new Date(),
          services: {},
          emails: [{address: `${username}@example.com`, verified: false}],
          email: `${username}@example.com`,
          lwWikiImport: true
        },
        validate: false
      })
    }
  }
})


let newWikiUserNames = [
  'Zack M. Davis', 'Wellthisisaninconvenience', 'Daniel Trenor',
  'Default', 'PotatoDumplings', 'Wikia', 'Thisisinconvenient',
  'A legion of trolls', 'Costanza R', 'KP', 'Rigtheousreason',
  'Kftnc', 'Adam Atlas', 'Andromeda', 'Gjm11', 'KajSotala',
  'Toby Bartels', 'Pw201', 'Frost Shock Level 4', 'Friendofasquid',
  'Nnn', 'Veal', 'Helencastillo', 'Markus Ramikin', 'Intansrirahayu',
  'CurtisHargrove', 'Jamesmea', 'ForrestWeiswolf', 'Ling123',
  'Xadmin', 'Maintenance script', 'Moore.thunder', 'Silent.ashes',
  'Jamesmeo', 'BDavid', 'Chimerablack', 'L3shy', 'Frankysl',
  'Emesmeo', 'Kha', 'Alan Dawrst', 'Nataniel', 'Natmaka',
  'Niremetal', 'Redirect fixer', 'Pandeism', 'SteveFrench',
  '86.129.245.179', 'Maëlig', 'TomR', 'Thrinaxodon', 'Mareofnight',
  'Ismaelvento', 'Econai', 'Domtheo', 'Dariusp686', 'Flarn2006',
  'HiEv', 'Alfpog', 'Justgerrardz', 'Bailey Helton', 'Nlacombe',
  'Brent.Allsop', 'BabySloth', 'Math vking', 'Jon Awbrey',
  'Claraliece', 'Daylmer', 'Debrasantorini', 'Bololoikak2',
  'DebraDeleon1955', 'DellReichert', 'DiscordBee', 'Byrequest',
  '153.18.17.22', 'BritneyCraig', 'DominickA', '194.73.43.126',
  '3u305501835', '64.241.37.140', '75.101.20.150', 'Cafemachiavelli',
  'CamilleHopkins', 'Demver5', 'DemiFyw', 'Demgeorge5', 'Aayn',
  'Amalion', 'DBAtkins', 'Creditrepairfixcredit',
  'CreateWiki script', 'AudreyTang', 'Ao', 'Cocktails019', 'AssaSom',
  'Adrianjackson21', 'Aftermath', 'Catbot', 'Bettytaylor23',
  'ChrisCote', 'Quotemstr', 'RalfFlanders', 'Reddittv', 'Rhoark',
  'Robbar', 'Russel08', 'OupeechiRwy', 'MyronYpjkqbn', 'N4thanl',
  'Nona3', 'NormanN64lugpbx', 'Normstone', 'Nosovicki', 'Odcameron',
  'SamiraW4', 'Sauski', 'Ujose73', 'Vocapp', 'Vriska',
  'Walker83Xxev', 'Wefghj', 'Wencesl6738', 'Willsons561',
  'Worldoptimization', 'YeseniaIson', 'Zao79Pwgx', 'Tigrennatenn',
  'Seojobs23', 'Snapkins', 'TheInterlang', 'Thedoctor',
  'Mrtricorder', 'Mrice', 'Moredoubts', 'Gww', 'Harry Wood',
  'HongAntoine', 'IgorLobanov', 'Illuminosity', 'Ipodsoft',
  'Dredmorbius', 'Dustin Wyatt', 'Dynamic', 'Edwga', 'ElsaWeston',
  'EnosKeen9', 'Fargone', 'Fordi', 'Lanita1223', 'Litter13rugby',
  'Marimeoa', 'MartyIhzvppfw', 'MatthewX02', 'Mcpersonson', 'Mivpl',
  'Lamar63Wizidj', 'Jheena789', 'Jja', 'Jolinsa', 'JustMichael1984',
  'Knowledgeableow', 'Kuriakatto', '128.111.17.17'
]