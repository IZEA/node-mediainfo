node wrapper for mediainfo.

This product uses [MediaInfo](http://mediaarea.net/MediaInfo) library, Copyright (c) 2002-2014 [MediaArea.net SARL](mailto:Info@MediaArea.net)

_Warning: contains 24MiB of binaries for osx, linux, windows. You can delete the platforms you don't need_


### Using child_process power

You can pass an object as first argument to use exec options. See [Node child_process](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback).

### Changelog
- v1.4.5
    - Update README and patch version.

- v1.4.2
    - fixed file read bug.

- v1.4.0
    - normalize data json.

- v1.3.0
    - fixed bug mediainfo process lock.
    - fixed bug peak hdd reading
    - update mediainfo version.

### Usage

    npm i @touno-io/mediainfo

then:

```js
const mediainfo = require('@touno-io/mediainfo')
mediainfo([ 'foo/bar.mkv' ]).then((data) => {
  for (let i in data) {
    console.log('%s parsed', data[i].file)
    console.log('MediaInfo data:', data[i])
  }
}).catch(function (e){
  console.error(e)
})
```

```js
const mediainfo = require('@touno-io/mediainfo')
mediainfo({ maxBuffer: 'infinity' }, [ 'foo/bar.mkv' ]).then((data) => {
  for (let i in data) {
    console.log('%s parsed', data[i].file)
    console.log('MediaInfo data:', data[i])
  }
}).catch(function (e){
  console.error(e)
})
```

### Glob

You can use glob to match files:

```js
const mediainfo = require('@touno-io/mediainfo')
mediainfo([ 'foo2/*mp3', 'foo3/*.ogg' ]).then((data) => {
  for (let i in data) {
    console.log('%s parsed', data[i].file)
    console.log('MediaInfo data:', data[i])
  }
}).catch(function (e){
  console.error(e)
})
```

### Cleaning unneccesary binaries

You can clean unneeded binaries, with gulp and nwjs for example:

```js
var del = require('del')
var path = require('path')
var pkJson = require('./package.json')

// clean @touno-io/mediainfo
gulp.task('clean:mediainfo', () => {
    return Promise.all(['linux32','linux64'].map((platform) => {
        console.log('clean:mediainfo', platform)
        const sources = path.join(releasesDir, pkJson.name, platform)
        return del([
            path.join(sources, 'node_modules/@touno-io/mediainfo/lib/*'),
            path.join(sources, pkJson.name + '.app/Contents/Resources/app.nw/node_modules/@touno-io/mediainfo/lib/*'),
            '!'+path.join(sources, 'node_modules/@touno-io/mediainfo/lib/'+platform),
            '!'+path.join(sources, pkJson.name + '.app/Contents/Resources/app.nw/node_modules/@touno-io/mediainfo/lib/'+platform)
        ])
    }))
})
```
Or you can use bash script to do this, e.g to clean all binaries except OSX 64 you can run this from your project root:

```bash
find ./node_modules/@touno-io/mediainfo/lib/* -maxdepth 1 -type d -not -name "osx64" | xargs rm -rf
```
