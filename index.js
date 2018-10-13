const path = require('path')
const xml2js = require('xml2js')
const glob = require('glob')
const exec = require('child_process').exec

const getCmd = () => {
  let arch = process.arch.match(/64/) ? '64' : '32'
  switch (process.platform) {
    case 'darwin': return safeLocalPath(path.join(__dirname, '/lib/osx64/mediainfo'))
    case 'win32': return safeLocalPath(path.join(__dirname, '/lib/win32/mediainfo.exe'))
    case 'linux': return `LD_LIBRARY_PATH=${safeLocalPath(path.join(__dirname, `/lib/linux${arch}`))} ${safeLocalPath(path.join(__dirname, `/lib/linux${arch}`, '/mediainfo'))}`
    default: throw 'unsupported platform'
  }
}
const buildOutput = obj => {
    let out = {}
    let idVid = idAud = idTex = idMen = idOth = 0

    out.file = obj['$'].ref
    for (let i in obj.track) {
      if (obj.track[i]['$']['type'] === 'General') {
        out.general = {}
        for (let f in obj.track[i]) {
          if (f !== '$') out.general[f.toLowerCase()] = obj.track[i][f]
        }
      } else if (obj.track[i]['$']['type'] === 'Video') {
        if (!idVid) out.video = []
        out.video[idVid] = {}
        for (let f in obj.track[i]) {
          if (f !== '$') out.video[idVid][f.toLowerCase()] = obj.track[i][f]
        }
        idVid++
      } else if (obj.track[i]['$']['type'] === 'Audio') {
        if (!idAud) out.audio = []
        out.audio[idAud] = {}
        for (let f in obj.track[i]) {
          if (f !== '$') out.audio[idAud][f.toLowerCase()] = obj.track[i][f]
        }
        idAud++
      } else if (obj.track[i]['$']['type'] === 'Text') {
        if (!idTex) out.text = []
        out.text[idTex] = {}
        for (let f in obj.track[i]) {
          if (f !== '$') out.text[idTex][f.toLowerCase()] = obj.track[i][f]
        }
        idTex++
      } else if (obj.track[i]['$']['type'] === 'Menu') {
        if (!idMen) out.menu = []
        out.menu[idMen] = {}
        for (let f in obj.track[i]) {
          if (f !== '$') out.menu[idMen][f.toLowerCase()] = obj.track[i][f]
        }
        idMen++
      } else {
        if (!idOth) out.other = []
        out.other[idOth] = {}
        for (let f in obj.track[i]) {
          if (f !== '$') out.other[idOth][f.toLowerCase()] = obj.track[i][f]
        }
        idOth++
      }
    }
    return out
}

const buildJson = (xml) => new Promise((resolve, reject) => {
  xml2js.parseString(xml, (err, obj) => {
    if (err) return reject(err)
    if (!obj['MediaInfo']) return reject('Something went wrong')
    obj = obj['MediaInfo']

    let out = []
    if (Array.isArray(obj.media)) {
      for (let i in obj.media) {
        out.push(buildOutput(obj.media[i]))
      }
    } else {
      out.push(buildOutput(obj.media))
    }
    resolve(out)
  })
})

const safeLocalPath = path => process.platform.match('win32') ? `"${path}"` : `'${path.replace(/'/g, `'"'"'`)}'`

module.exports = (...args) => {
  args = (args[0] instanceof Array) ? args[0] : args
  const execChild = (cmd, options) => new Promise((resolve, reject) => {
    let child = exec(cmd, options, (error, stdout, stderr) => {
      if (error !== null || stderr !== '') {
        child.kill()
        return reject(error || stderr)
      }
      buildJson(stdout).then(data => {
        child.kill()
        resolve(data)
      }).catch(ex => {
        child.kill()
        reject(ex)
      })
    })
  })

  let cmd_options = typeof args[0] === 'object' ? args.shift() : {}
  let cmd = []

  cmd.push(getCmd()) // base command
  cmd.push('--Output=XML --Full') // args

  for (let idx = 0; idx < args.length; idx++) {
    const val = args[idx]
    let files = glob.sync(val, { cwd: (cmd_options.cwd || process.cwd()), nonull: true })
    for (let i in files) { cmd.push(safeLocalPath(files[i])) }
  }
  
  return execChild(cmd.join(' '), cmd_options)
}
