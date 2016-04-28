var path = require('path'),
    X2JS = require('xml-json-parser'),
    exec = require('child_process').execFile;

function getCmd() {
    var arch = process.arch.match(/64/) ? '64' : '32';

	switch(process.platform) {
        case 'darwin':
            return path.join(__dirname, '/bin/osx64/mediainfo');
        case 'win32':
            return path.join(__dirname, '/bin/win32/mediainfo.exe');

        case 'linux':
            return [
                'LD_LIBRARY_PATH="' + path.join(__dirname, '/bin/linux' + arch) + '"',
                path.join(__dirname, '/bin/linux' + arch, '/mediainfo')
            ].join(' ')
	}
}

function buildOutput(obj) {
    var out = {
        details: {},
        tracks: []
    };
    var track = 0; // counting actual tracks (not General)
    
    for (var i in obj.track) {
        // general
        if (obj.track[i]['_type'] === 'General') {
            out.file = obj.track[i]['Complete_name'];
            for (var f in obj.track[i]) {
                if (f !== '_type') out.details[f.toLowerCase()] = obj.track[i][f];
            }

        // audio/video/text
        } else {
            out.tracks[track] = {};
            for (var f in obj.track[i]) {
                out.tracks[track][f.toLowerCase()] = obj.track[i][f];
            }
            track++;
        }
    }
    return out;
}

function buildJson(xml) {
    var x2js = new X2JS();
    xml = x2js.xml_str2json(xml);

    if (!xml['Mediainfo']) throw 'Something went wrong';
    xml = xml['Mediainfo'];

    var out = [];

    if (Array.isArray(xml.File)) {
        for (var i in xml.File) {
            out.push(buildOutput(xml.File[i]));
        }
    } else {
        out.push(buildOutput(xml.File));
    }

    return out;
}

module.exports = function MediaInfo() {
    var files = Array.prototype.slice.apply(arguments),
        cmd = getCmd(),
        args = ["--Output=XML"].concat(files).concat('--Full');

    return new Promise(function (resolve, reject) {
        exec(cmd, args, function (error, stdout, stderr) {
            if (error !== null || stderr !== '') {
                reject(error || stderr);
            } else {
                resolve(buildJson(stdout));
            }
        });
    });
};