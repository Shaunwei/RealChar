jar=~/java/compiler.jar
cc="java -jar $jar"
$cc lame.all.js --language_in ECMASCRIPT5 --js_output_file lame.min.js
