# find . -name .DS_Store -delete
# cleanup the old stuff
rm -rf mac/OMG.app/Contents/Resources/chrome/
rm -rf windows/omg/chrome/
rm -rf linux/omg/chrome/
rm -rf mac/OMG.app/Contents/Resources/extensions/
rm -rf windows/omg/extensions/
rm -rf linux/omg/extensions/
rm -rf mac/OMG.app/Contents/Resources/defaults/
rm -rf windows/omg/defaults/
rm -rf linux/omg/defaults/
rm -rf mac/OMG.app/Contents/Resources/updates/
rm -rf windows/omg/updates/
rm -rf linux/omg/updates/
rm -f  mac/OMG.app/Contents/Resources/application.ini 
rm -f windows/omg/application.ini
rm -f linux/omg/application.ini

# copy the new stuff from src
cp -r ../src/ mac/OMG.app/Contents/Resources/
cp -r ../src/ linux/omg/
cp -r ../src/ windows/omg/

# zip
cd windows
zip -r ../omg-windows.zip *
cd ../mac
zip -r ../omg-mac.zip *
cd ../linux
tar -czvf ../omg-linux.tar.gz *
cd ..
ls -l