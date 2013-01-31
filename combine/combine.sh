cd ..
: ------------------ build tags -----------------
: sed -i.bak "s|{BUILD_DATE}|`date '+%m/%d/%y'`|g" ./src/main.js
: sed -i.bak "s|{BUILD_NUMBER}|$1|g" ./src/main.js

: -------------------- index --------------------
echo -e "<!DOCTYPE html>\n\n<html>\n\t<head>\n\t\t<meta name=\"viewport\" content=\"width=device-width, minimum-scale=1, maximum-scale=1\"/>" > ./bin/index.html

: -------------------- Testing --------------------
echo "" >> ./bin/index.html
echo -e "\t\t<!-- A5-CL -->" >> ./bin/index.html

echo "" > ./bin/combine.temp.js
echo "" > ./npm/lib/A5-CL-Node.js
echo "" > ./bin/A5-CL_no_lang.js
cat ./lib/A5.js >> ./bin/combine.temp.js
cat ./lib/A5.js >> ./npm/lib/A5-CL-Node.js
echo "" >> ./bin/combine.temp.js
echo "" >> ./npm/lib/A5-CL-Node.js
cat ./combine/closures/open.txt >> ./bin/combine.temp.js
cat ./combine/closures/open.txt >> ./bin/A5-CL_no_lang.js
cat ./combine/closures/open.txt >> ./npm/lib/A5-CL-Node.js
while read line
do
	cat $line >> ./bin/combine.temp.js
	cat $line >> ./bin/A5-CL_no_lang.js
	cat $line >> ./npm/lib/A5-CL-Node.js
	echo -e "\n" >> ./bin/A5-CL_no_lang.js
	echo -e "\n" >> ./bin/combine.temp.js
	echo -e "\n" >> ./npm/lib/A5-CL-Node.js
	echo -e '\t\t<script src="'$line'" type="text/javascript"></script>' >> ./bin/index.html
done < ./combine/files.txt
cat ./combine/closures/close.txt >> ./bin/combine.temp.js
cat ./combine/closures/close.txt >> ./bin/A5-CL_no_lang.js
cat ./combine/closures/close.txt >> ./npm/lib/A5-CL-Node.js

java -jar ./combine/yuicompressor-2.4.2.jar ./bin/combine.temp.js -o ./bin/combine-min.temp.js --charset utf-8
cat ./bin/combine.temp.js > ./bin/A5-CL.js
cat ./bin/combine-min.temp.js > ./bin/A5-CL-min.js
rm ./bin/combine.temp.js
rm ./bin/combine-min.temp.js
gzip -c ./bin/A5-CL-min.js > ./bin/A5-CL-min.js.gz
: -------------------- index close--------------------
echo -e '\t<body>\n\t</body>\n</html>' >> ./bin/index.html

: -------------------- dom ---------------------------

echo "" > ./bin/A5-CL-DOM.js
echo "" > ./bin/A5-CL-DOM_no_lang.js
cat ./bin/A5-CL.js >> ./bin/A5-CL-DOM.js
cat ./bin/A5-CL_no_lang.js >> ./bin/A5-CL-DOM_no_lang.js
echo -e "\n" >> ./bin/A5-CL-DOM.js
echo -e "\n" >> ./bin/A5-CL-DOM_no_lang.js
while read line
do
	cat $line >> ./bin/A5-CL-DOM.js
	cat $line >> ./bin/A5-CL-DOM_no_lang.js
	echo -e "\n" >> ./bin/A5-CL-DOM.js
	echo -e "\n" >> ./bin/A5-CL-DOM_no_lang.js
done < ./combine/domfiles.txt

java -jar ./combine/yuicompressor-2.4.2.jar ./bin/A5-CL-DOM.js -o ./bin/A5-CL-DOM-min.js --charset utf-8

gzip -c ./bin/A5-CL-DOM-min.js > ./bin/A5-CL-DOM-min.js.gz

: -------------------- node ---------------------------

cat ./src/initializers/nodejs/NodeJSInitializer.js >> ./npm/lib/A5-CL-Node.js