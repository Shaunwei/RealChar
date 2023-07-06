(
echo 'function lamejs() {'
browserify --list src/js/index.js  | grep lamejs | grep -v node_modules | xargs cat | grep -v -e 'common\..*;' -e 'require(' -e 'module.exports.*;$' | sed 's/^module.exports = {/var module_exports = {/';
echo 'L3Side.SFBMAX = (Encoder.SBMAX_s * 3);'
echo '//testFullLength();'
echo 'lamejs.Mp3Encoder = Mp3Encoder;'
echo 'lamejs.WavHeader = WavHeader;'
echo '}'
echo "//fs=require('fs');"
echo 'lamejs();'
)| grep -v -e '^\s*assert\s*(.*);' >lame.all.js

#cc=closure-compiler
jar=~/java/compiler.jar
cc="java -jar $jar"
$cc lame.all.js --language_in ECMASCRIPT5 --js_output_file lame.min.js
