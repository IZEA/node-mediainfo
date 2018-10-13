const path = require('path')
const xml2js = require('xml2js')
const glob = require('glob')
const exec = require('child_process').exec

const convertType = (args) => {
  if (args instanceof Array) {
    if (args.length === 1) {
      if (typeof args[0] === 'string') {
        let sVal = args[0].trim()
        if (['yes', 'no'].indexOf(sVal.toLowerCase()) > -1) {
          return sVal.toLowerCase() === 'yes' ? true : false
        } else if (/\d{4}-\d{2}-\d{2}.\d{2}:\d{2}:\d{2}/.test(sVal)) {
          return new Date(sVal)
        } else {
          let nVal = +sVal
          return isNaN(nVal) ? sVal : nVal
        }
      } else {
        return args[0]
      }
    } else {
      return args
    }
  } else if (args instanceof Object) {
    return args
  }
}

const getCmd = () => {
  let arch = process.arch.match(/64/) ? '64' : '32'
  switch (process.platform) {
    case 'win32': return safeLocalPath(path.join(__dirname, '/lib/win32/mediainfo.exe'))
    case 'win64': return safeLocalPath(path.join(__dirname, '/lib/win64/mediainfo.exe'))
    case 'darwin': return safeLocalPath(path.join(__dirname, '/lib/osx64/mediainfo'))
    case 'linux': return `LD_LIBRARY_PATH=${safeLocalPath(path.join(__dirname, `/lib/linux${arch}`))} ${safeLocalPath(path.join(__dirname, `/lib/linux${arch}`, '/mediainfo'))}`
    default: throw 'unsupported platform'
  }
}
const buildOutput = obj => {
    let out = {}
    let idVid = idAud = idTex = idMen = idOth = 0
    let id = { 'general': 0, 'video': 0, 'audio': 0, 'text': 0, 'menu': 0, 'other': 0 }
    let group = [ 'video', 'audio', 'text', 'menu' ]
    out.file = obj['$'].ref
    for (let i in obj.track) {
      let type = obj.track[i]['$']['type'].toLowerCase()
      let l = id[type]
      
      if (group.indexOf(type) > -1) {
        if (!out[type]) out[type] = []
        out[type][l] = {}
        for (let f in obj.track[i]) {
          if (f !== '$') out[type][l][f.toLowerCase()] = convertType(obj.track[i][f])
        }
        id[type]++
      } else if (type === 'general') {
        if (!out[type]) out[type] = {}
        for (let f in obj.track[i]) {
          if (f !== '$') out[type][f.toLowerCase()] = convertType(obj.track[i][f])
        }
      } else {
        if (!out.other) out.other = []
        out.other[l] = {}
        for (let f in obj.track[i]) {
          if (f !== '$') out.other[l][f.toLowerCase()] = obj.track[i][f]
        }
        id['other']++
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
  args = (args[0] instanceof Array) ? args[0] : args

  cmd.push(getCmd()) // base command
  cmd.push('--Output=XML --Full') // args

  for (let idx = 0; idx < args.length; idx++) {
    const val = args[idx]
    let files = glob.sync(val, { cwd: (cmd_options.cmd || process.cwd()), nonull: true })
    for (let i in files) { cmd.push(safeLocalPath(files[i])) }
  }
  
  return execChild(cmd.join(' '), cmd_options)
}
