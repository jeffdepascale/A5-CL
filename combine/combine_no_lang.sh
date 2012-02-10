cd ..
: ------------------ build tags -----------------
: sed -i.bak "s|{BUILD_DATE}|`date '+%m/%d/%y'`|g" ./src/main.js
: sed -i.bak "s|{BUILD_NUMBER}|$1|g" ./src/main.js

: -------------------- index --------------------
echo "<!DOCTYPE html>\n\n<html>\n\t<head>\n\t\t<meta name=\"viewport\" content=\"width=device-width, minimum-scale=1, maximum-scale=1\"/>" > ./bin/index.html

: -------------------- Testing --------------------
echo "" >> ./bin/index.html
echo "\t\t<!-- A5-CL -->" >> ./bin/index.html

echo "" > ./bin/combine.temp.js
cat ./combine/closures/open.txt >> ./bin/combine.temp.js
while read line
do
	cat $line >> ./bin/combine.temp.js
	echo -e "\n" >> ./bin/combine.temp.js
	echo '\t\t<script src="'$line'" type="text/javascript"></script>' >> ./bin/index.html
done < ./combine/files_no_lang.txt
cat ./combine/closures/close.txt >> ./bin/combine.temp.js

cat ./combine/copyrights.txt ./bin/combine.temp.js > ./bin/A5-CL_no_lang.js
rm ./bin/combine.temp.js
: -------------------- index close--------------------
echo '<body>\n\t</body>\n</html>' >> ./bin/index.html