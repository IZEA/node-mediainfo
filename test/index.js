const mediainfo = require('../index.js')
const util = require('util')

mediainfo('F:/Google Drive/NAS-SERVER/Anime-Series/Anime Naruto Shippuuden/Naruto Shippuuden • Season 10 การประชุมของห้าคาเงะ/Naruto Shippuuden 215 [720p].mkv').then(data => {
  console.log(util.inspect(data, { showHidden: false }, null, true))
}).catch(ex => {
  console.error(ex)
})
