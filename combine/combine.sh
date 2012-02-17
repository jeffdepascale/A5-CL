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
cat ./combine/closures/open.txt >> ./bin/combine.temp.js
while read line
do
	cat $line >> ./bin/combine.temp.js
	echo -e "\n" >> ./bin/combine.temp.js
	echo -e '\t\t<script src="'$line'" type="text/javascript"></script>' >> ./bin/index.html
done < ./combine/files.txt
cat ./combine/closures/close.txt >> ./bin/combine.temp.js

java -jar ./combine/yuicompressor-2.4.2.jar ./bin/combine.temp.js -o ./bin/combine-min.temp.js --charset utf-8
cat ./combine/copyrights.txt ./bin/combine.temp.js > ./bin/A5-CL.js
cat ./combine/copyrights.txt ./bin/combine-min.temp.js > ./bin/A5-CL-min.js
rm ./bin/combine.temp.js
rm ./bin/combine-min.temp.js
gzip -c ./bin/A5-CL-min.js > ./bin/A5-CL-min.js.gz
: -------------------- index close--------------------
echo -e '\t<body>\n\t</body>\n</html>' >> ./bin/index.html