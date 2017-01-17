# server of chinese painting style

## Setup
**Dependencies**:
* [jcjohnson/neural-style](https://github.com/jcjohnson/neural-style)
* nodejs (tested with v0.10.25)

**Config options:**
* `port`: (required) The HTTP server port on which the web server will listen.
* `dataPath`: (required) The directory where image and settings input files and image output files will be stored. There shouldn't be any other files in this directory - neural-style-server will scan it on startup to discover data created by previous runs.
* `neuralStylePath`: (requierd) The directory where the [neural-style](https://github.com/jcjohnson/neural-style) repository is cloned.
* `username`: (optional) A username to use for HTTP basic auth. May be omitted to disable auth.
* `password`: (optional) A password to use for HTTP basic auth. May be omitted to disable auth. 

## Run
You must run neural-style-server from a shell that has environment variables configured to use Torch (if you did not allow the Torch installer to configure this by default, you can run `source install/bin/torch-activate` from the Torch directory to set up the necessary environment).

To launch neural-style-server, run:
```
nodejs app.js
```
