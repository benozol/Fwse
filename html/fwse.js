
var filename;

$(function() {
    var x = $('li').first();
    setSelection(x);
    adjustSectioning($('ul#tree li'));

    $('#output').addClass('hidden');

    $('#editDialog').dialog({ 
            'modal': true,
            'autoOpen': false,
            'close': function() {
                unsetCurrentShortcuts();
            },
            'open': function() {
                $(this).children('textarea').focus();
            },
            'height': '50%',
            'width': '50%'
    });

    var filenameInput = $('#filename input');
    var filenameLabel = $('#filename span');
    filename = document.location.hash.substring(1);
    if( filename ) {
        filenameLabel.text( filename );
        filenameInput.hide();
        var str = readFromFile(filename);
        if( str ) {
            $('#tree').html(str);
            setSelection( $('#tree li').first() );
        }
        resetCurrentShortcuts();
    } else {
        resetCurrentShortcuts();
        filenameLabel.hide();
        unsetCurrentShortcuts();
    }

    // filenameLabel.click( function( event ) {
    //     unsetCurrentShortcuts();
    //     filenameLabel.hide();
    //     filenameInput.show();
    // });
    filenameInput.keydown( function( event ) {
       switch( event.keyCode ) {
           case 13:
               filename = filenameInput.val();
               log('try read file ' + filename);
               var str = readFromFile(filename);
               if( str )
                   $('#tree').html(str);
               filenameInput.hide();
               filenameLabel.text( filename );
               filenameLabel.show();
               resetCurrentShortcuts();
               return false;
           case 27:
               if( filename ) {
                   filenameInput.hide();
                   filenameLabel.text( filename );
                   filenameLabel.show();
                   resetCurrentShortcuts();
               }
               return false;
           default:
               return true;
       }
    });
});

function getFile() {
    return $('#fileinput')[0].files[0];
}

////////////////////////////////////////////////////////////////////////////////
// Shortcuts

function createAt( x, defeatCallback ) {
    var la = $('<li>');
    var input = $('<input>').attr('name', 'subject').attr('type', 'text');
    la.append(input);
    la.append($('<span>').addClass('infos'));
    la.append($('<div>').addClass('body'));
    la.append($('<ul>').addClass('subitems'));
    unsetCurrentShortcuts();
    input.keydown(function(event) {
        switch( event.keyCode ) {
            case 27:
                la.remove();
                resetCurrentShortcuts();
                defeatCallback();
                resetCurrentShortcuts();
                return;
            case 13:
                var subject = $('<span>').attr('class', 'subject');
                subject.text(input.val());
                input.replaceWith(subject);
                setSelection(la);
                resetCurrentShortcuts();
                return la;
            default:
                return;
        }
    });
    x.replaceWith(la);
    input.focus();
}

function pasteAt( pos ) {
    var elt = $('#trashcan').children().first();
    if( elt.length == 0 ) {
        log("Nothing to paste");
        pos.remove();
        return;
    }
    elt.remove();

    var insertions;
    if( elt[0].nodeName == "LI" )
        insertions = elt;
    else if( elt[0].nodeName == "UL" )
        insertions = elt.children();

    pos.replaceWith( insertions );
    return insertions;
}

function firstLast(li) {
}

const globalShortcuts = {
    'up': function(li) {
        var la;

        if( li.prev().length > 0 ) {
            la = li.prev();
            while( la.children('ul.subitems').children('li').length > 0 )
                la = la.children('ul.subitems').children('li').last()
        } else if( li.parent().not('ul#tree').length > 0 )
            la = li.parent().parent();

        if( la )
            setSelection( la );
    },
    'down': function(li) {
        var la;

        var tmp = li.children('ul.subitems:visible').children('li');
        if( tmp.length > 0 )
            la = tmp.first();
        else {
            if( li.next().length > 0 )
                la = li.next();
            else {
                tmp = li;
                while( tmp.parent().not('ul#tree').length > 0 && tmp.next().length == 0 )
                    tmp = tmp.parent().parent();
                if( tmp.next().length > 0 )
                    la = tmp.next();
            }
        }
        if( la )
            setSelection( la.first() );
    },
    'S-up': function( li ) {
        var la = li.prev();
        if( la.length == 1 )
            setSelection( la );
    },
    'S-down': function(li) {
        var la = li.next();
        if( la.length == 1 )
            setSelection( la );
    },
    'right': function(li) {
        var la = li.children().children().first();
        if( la.length > 0 ) {
            li.removeAttr('id');
            setSelection( la.first() );
        }
    },
    'left': function(li) {
        la = li.parents().first();
        if( la.attr('id') != 'tree' ) {
            li.removeAttr('id');
            setSelection( la.parents().first() );
        }
    },
    'editSubject': function(li) {
        unsetCurrentShortcuts();
        var input = $('<input>').attr('name', 'subject').attr('type', 'text');
        var subject = li.children('span.subject').first().replaceWith(input);
        input.focus();
        input.val(subject.text());
        input.keydown(function(event) {
            switch( event.keyCode ) {
                case 27:
                    input.replaceWith(subject);
                    resetCurrentShortcuts();
                    return false;
                case 13:
                    subject.text($(this).val());
                    $(this).replaceWith(subject);
                    resetCurrentShortcuts();
                    return false;
                default:
                    return true;
            }
        });
    },
    'insert': function(li, event) {
        createAt(createDummy().insertAfter(li), holdout(setSelection, li));
    },
    'S-insert': function(li) {
        createAt(createDummy().insertBefore(li), holdout(setSelection, li));
    },
    'toggleHeadline': function(li) {
        li.toggleClass('headline'); 
        adjustSectioning(li);
    },
    'editBody': function(li) {
        var subject = li.children('span.subject').first();
        var body = li.children('div.body').first();
        var dlg = $('#editDialog');
        var textarea = $('#editDialog textarea');
        textarea.val(body.text());
        unsetCurrentShortcuts();
        dlg.dialog('option', {
            'title': subject.text(),
            'buttons':  {
                "Ok": function() {
                    body.text(textarea.val());
                    dlg.dialog('close');
                    resetCurrentShortcuts();
                },
                "Cancel": function() {
                    dlg.dialog('close');
                    resetCurrentShortcuts();
                }
        }});
        dlg.dialog('open');
    },
    'writeToFile': function() {
        var str = "";
        str += "\\documentclass{scrartcl}\n";
        str += "\\begin{document}\n";
        str += generateOutput($('ul#tree'));
        str += "\\end{document}\n";
        writeToFile(filename, str);
    },
    'toggleDebug': function() {
        $('div#output').toggleClass('hidden');
    },
    'parentize': function(li) {
        var ulConstruct = li.children('ul.subitems');
        if( ulConstruct.children().length > 0 )
            return trace(undefined, "selected items has children");
        var pos = $('<hr>');
        li.append(ulConstruct);
        ulConstruct.append( pos );
        setSelection($());
        setCurrentShortcuts("Parentizing", {
            'insert': function() {
                createAt(pos, function() {
                    ulConstruct.remove();
                    setSelection(li);
                } );
            },
            'paste': function() {
                var insertions = pasteAt(pos);
                if( insertions ) {
                    setSelection( insertions.last() );
                    adjustSectioning( insertions );
                }
                resetCurrentShortcuts();
            },
            'cancel': function() {
              ulConstruct.remove();
              resetCurrentShortcuts();
              setSelection( li );
            }
        });
    },
    'paste': function(li, event) {
        var x = createDummy().insertAfter(li);
        var insertions = pasteAt(x);
        if( insertions ) {
            setSelection(insertions.last());
            adjustSectioning( insertions );
        }
    },
    'S-paste': function( li ) {
        var x = createDummy().insertBefore(li);
        var insertions = pasteAt(x);
        if( insertions ) {
            setSelection(insertions.first());
            adjustSectioning( insertions );
        }
    },
    'toggleSubitems': function( li ) {
        li.children('ul.subitems').toggleClass('hidden');
        if( li.children('ul.subitems').hasClass('hidden') )
            li.children('span.infos').text( "... " + li.children('ul.subitems').children('li').length );
        else
            li.children('span.infos').text("");
    },
    'delete': function(li) {
        log("Delete ...");
        function delete_( choosing, nextSelection ) {
            choosing.remove();
            $('#trashcan').append( choosing );
            setSelection( nextSelection );
            resetCurrentShortcuts();
        }
        setCurrentShortcuts("Deleting", {
            'cancel': resetCurrentShortcuts,
            'S-delete': function() {
                delete_( li.parents('ul.subitems').first(), li.parents('li').first() );
            },
            'delete': function() {
                var nextSelection;
                    if( li.next().length > 0 )
                        nextSelection = li.next();
                    else if( li.prev().length > 0 )
                        nextSelection = li.prev();
                    else
                        nextSelection = li.parents('li').first();
                delete_( li, nextSelection );
            },
        });
    }
};

var keyboardLayout = {
    78: 'down',
    82: 'up',
    84: 'right',
    83: 'left',
    69: 'editSubject',
    79: 'insert',
    72: 'toggleHeadline',
    65: 'editBody',
    88: 'toggleDebug',
    87: 'writeToFile',
    80: 'paste',
    188: 'parentize',
    27: 'cancel',
    68: 'delete',
    77: 'toggleSubitems'

};

function setCurrentShortcuts( message, shortcuts ) {
    if( message ) message += ":";
    for( var key in shortcuts )
        message += " " + key;
    $('#shortcutsIndicator').text( message );
    currentShortcuts = shortcuts || {};
}
function resetCurrentShortcuts() {
    setCurrentShortcuts( "", globalShortcuts );
}
function unsetCurrentShortcuts() {
    $('#shortcutsIndicator').text("");
    currentShortcuts = {};
}
var currentShortcuts;
$(window).keydown(function(event) {
    var command = keyboardLayout[event.keyCode];
    if( command ) {
        command = (event.shiftKey ? "S-" : "") + command;
        log( "Command " + command );
        var commandSemantics = currentShortcuts[command];
        if( commandSemantics ) {
            commandSemantics(getSelection(), event);
            return false;
        } else {
            log("(Currently) no semantics for " + command);
            return true;
        }
    } else {
        log(event.keyCode);
        return true;
    }
});

////////////////////////////////////////////////////////////////////////////////
// Selection

function setSelection(li) {
    $('#selected').removeAttr('id');
    li.attr('id', 'selected');
}
function getSelection() {
    return $('#tree li#selected');
}
////////////////////////////////////////////////////////////////////////////////
// Stuff

var sectionsByDepth = [ 'section', 'subsection', 'subsubsection' ];
var sectionClasses = 'section subsection subsubsection';

function getHeadlineDepth(li) {
    var depth = 0;
    while( li.parents().first().attr('id') != 'tree' ) {
        li = li.parents('li').first();
        depth ++;
    }
    return depth;
}
function adjustSectioning(jq) {
    jq.each(function(ix, li) {
        li = $(li);
        log('adjust ' + li.children('span').first().text());
        li.removeClass(sectionClasses)
        if( li.hasClass('headline') )
            li.addClass(sectionsByDepth[getHeadlineDepth(li)]);
    });
};

function escapeLatex(str) {
    return str;
    /*
        .replace(/%/g, '\\%')
        .replace(/\\/g, '\\\\')
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}')
        .replace(/#/g, '\\#')
        .replace(/#/g, '\\#')
        .replace(/&/g, '\\&')
        .replace(/^/g, '\\^')
        .replace(/</g, '\\en\\lt')
        .replace(/>/g, '\\gt')
        ;
        */
}

function generateOutput(ul) {
    var res = "";
    ul.children('li').each(function(ix, li) {
        li = $(li);
        res += "\n\n"
        var subject = escapeLatex(li.children('span.subject').text());
        var body = escapeLatex(li.children('div.body').text());
        res += "% " + subject + "\n";
        if( li.hasClass('headline') ) {
            var depth = getHeadlineDepth(li);
            res += "\\" + sectionsByDepth[depth] + "{" + subject + "}";
        } else
            res += "\\hspace{0pt}\\marginpar{\\tiny{" + subject + "}}";
        res += "\n" + body + "\n";
        res += generateOutput(li.children(ul));
    });
    return res;
}

function readFromFile( filename ) {
    log("Read from " + filename);
    try {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    } catch (e) {
        alert("Permission to save file was denied.");
        return;
    }

    var file = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(filename);
    if( !file.exists() )
        return;

    var iStream = Components.classes["@mozilla.org/network/file-input-stream;1"]
		.createInstance( Components.interfaces.nsIFileInputStream );
	iStream.init( file, 0x01, 0444, 0);
    iStream.QueryInterface( Components.interfaces.nsILineInputStream );

    var line = {}
    iStream.readLine( line );
    iStream.close();

    return line.value.substring(1);
}

function writeToFile(filename, data) {
    log("Write to " + filename);
    try {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    } catch (e) {
        alert("Permission to save file was denied.");
        return;
    }
    var file = Components.classes["@mozilla.org/file/local;1"]
        .createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(filename);

    // file is nsIFile, data is a string
    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
        .createInstance(Components.interfaces.nsIFileOutputStream);

    // use 0x02 | 0x10 to open file for appending.
    foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
    // write, create, truncate
    // In a c file operation, we have no need to set file mode with or operation,
    // directly using "r" or "w" usually.

    // if you are sure there will never ever be any non-ascii text in data you can 
    // also call foStream.writeData directly
    var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
        .createInstance(Components.interfaces.nsIConverterOutputStream);
    converter.init(foStream, "UTF-8", 0, 0);
    var str = "%" + $('#tree').html().replace(/\n/g, '') + '\n';
    converter.writeString(str);
    converter.writeString(data);
    converter.close(); // this closes foStream
    log("Done");
}

////////////////////////////////////////////////////////////////////////////////
// Utils

function createDummy() {
    return $('<div>').css('display', 'none');
}

function repeatString(str, n) {
    var res = ""
    for(var i=0; i<n; i++) res += str;
    return res;
}

function log(msg) {
    $('div#output div').prepend($('<br>'));
    $('div#output div').prepend(msg);
}

function holdout(f, x) {
    return function() { return f(x); }
}
function trace( value, msg ) {
    log( msg );
    return value;
}
