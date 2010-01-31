var omg = {
  
    // supported extensions
    types: {js: 1, css: 1},
  
    // list of files to minify
    queue: [],
  
    // add to queue of files to minify
    appendFile: function(file) {

        // skip already minified and non-supported
        var f = file.leafName;
        if (this.isMin(f)) {return;}
        if (!this.types[this.getExtension(f)]) {return;}
   
        var id = this.queue.push(file) - 1;
        
        var root = document.getElementById('omg-list');
        var listitem = document.createElement('listitem');
        
        var listcell = document.createElement('listcell');
        listcell.setAttribute("label", file.leafName);
        listitem.tooltipText = file.path;
        listitem.appendChild(listcell);

        listcell = document.createElement('listcell');
        listcell.setAttribute("label", file.fileSize);
        listcell.setAttribute('id', 'orig-' + id);
        listitem.appendChild(listcell);

        listcell = document.createElement('listcell');
        listcell.setAttribute('label', "queued...");
        listcell.setAttribute('id', 'min-' + id);
        listitem.appendChild(listcell);
    
        listcell = document.createElement('listcell');
        listcell.setAttribute('id', 'ratio-' + id);
        listitem.appendChild(listcell);

        root.appendChild(listitem);
        
    },

    appendDir: function(dir) {
        var files = dir.directoryEntries;
        while (files.hasMoreElements()) {
            var file = files.getNext().QueryInterface(Components.interfaces.nsIFile);
            if (file.isDirectory()) {
                omg.appendDir(file);
            } else {
                omg.appendFile(file);
            }
        }
    },
 
    getExtension: function(filename) {
        return filename.split('.').pop();
    },

    // returns TRUE is filename ends with -min
    isMin: function(filename) {
        return filename.split('-').pop() === "min." + this.getExtension(filename);
    },

    minifyQueue: function() {
        var path, name, ext, result;
        for (var i = 0; i < this.queue.length; i++) {
     
            // check if already 
            // things linger in the queue so we use the consecutive 
            //     array key as unique ID in the UI
            if (this.queue[i] === false) {continue;} 

            path = this.queue[i].path;
            name = this.queue[i].leafName;
            ext = this.getExtension(name);
            result = false;


            switch(ext) {
                case 'css':
                    result = YAHOO.compressor.cssmin(this.read(this.queue[i]));
                    break;
                case 'js':
                    result = jsmin(this.read(this.queue[i]));
                    break;
            }
            
            if (result) {
                var parts = path.split('.');
                parts.pop();
                out = parts.join('.') + '-min.' + ext;        
                var fileres = this.write(out, result);
                
                var minsize = fileres.fileSize;
                var origsize = this.queue[i].fileSize;
                var ratio = (100 * minsize/origsize).toFixed(2) + "%";
                document.getElementById('min-' + i).setAttribute('label', minsize);
                document.getElementById('ratio-' + i).setAttribute('label', ratio);
            }
            this.queue[i] = false;
        }
    },
 
    // read file contents, taken from mozdev code samples
    read: function(file) {

        var data = "";
        var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
                        createInstance(Components.interfaces.nsIFileInputStream);
        var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
                        createInstance(Components.interfaces.nsIConverterInputStream);
        fstream.init(file, -1, 0, 0);
        cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish

        var str = {};
        while (cstream.readString(4096, str)) { // read the whole file and put it in str.value
            data += str.value;
        }
        cstream.close(); // this closes fstream

        return data;
    },

    // write a file, taken from mozdev code samples
    write: function(path, data) {

        var file = Components.classes["@mozilla.org/file/local;1"].
                      createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(path);

        // file is nsIFile, data is a string
        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                         createInstance(Components.interfaces.nsIFileOutputStream);

        // use 0x02 | 0x10 to open file for appending.
        foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);
        // write, create, truncate
        // In a c file operation, we have no need to set file mode with or operation,
        // directly using "r" or "w" usually.

        // if you are sure there will never ever be any non-ascii text in data you can
        // also call foStream.writeData directly
        var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                          createInstance(Components.interfaces.nsIConverterOutputStream);
        converter.init(foStream, "UTF-8", 0, 0);
        converter.writeString(data);
        converter.close(); // this closes foStream
        return file;
    }
};


var omgDragObserver = {
    getSupportedFlavours : function () {
        var flavours = new FlavourSet();
        flavours.appendFlavour("application/x-moz-file","nsILocalFile");
        return flavours;
    },
    onDragOver: function (event,flavour,dragSession){},
    onDrop: function (evt,dropdata,session){
        
        for (var i = 0; i < session.numDropItems; i++) {
            var file = evt.dataTransfer.mozGetDataAt("application/x-moz-file", i);
            if (file instanceof Components.interfaces.nsILocalFile) {
                if (file.isDirectory()) {
                    omg.appendDir(file);
                } else {
                    omg.appendFile(file);
                }
            }
        }

        omg.minifyQueue();
    }
};