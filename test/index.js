const mediainfo = require('../index.js')
const util = require('util')

mediainfo(__dirname + '/file.mp4').then(data => {
  console.log(util.inspect(data, { showHidden: false }, null, true))
}).catch(ex => {
  console.error(ex)
})
