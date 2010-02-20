
var parameters = [];
$(function() {
    var x = $('li').first();
    x.attr('id', 'selected');
    adjustSectioning($('ul#tree li'));
    $('#editDialog').dialog({ 
            'modal': true,
            'autoOpen': false,
            'close': function() {
                setCurrentShortcuts();
            },
            'open': function() {
                $(this).children('textarea').focus();
            },
            'height': '50%',
            'width': '50%'
    });
    parameters = [];
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        var hash = hashes[i].split('=');
        parameters.push(hash[0]);
        parameters[hash[0]] = hash[1];
    }
    if( !parameters['filename'] )
        alert("Reload page with a filename as get parameter (...html?filename=/hom...)");
});

////////////////////////////////////////////////////////////////////////////////
// Shortcuts

const globalShortcuts = {
    'down': function(li) {
        var la = li.next();
        if( la.length == 1 ) {
            li.removeAttr('id');
            la.attr('id', 'selected')
        }
    },
    'up': function(li) {
        var la = li.prev();
        if( la.length == 1 ) {
            li.removeAttr('id');
            la.attr('id', 'selected')
        }
    },
    'right': function(li) {
        var la = li.children().children().first();
        if( la.length > 0 ) {
            li.removeAttr('id');
            la.first().attr('id', 'selected');
        }
    },
    'left': function(li) {
        la = li.parents().first();
        if( la.attr('id') != 'tree' ) {
            li.removeAttr('id');
            la.parents().first().attr('id', 'selected');
        }
    },
    'editSubject': function(li) {
        setCurrentShortcuts({});
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
    'insertBelow': function(li) {
        setCurrentShortcuts({});
        var la = $('<li>');
        var input = $('<input>').attr('name', 'subject').attr('type', 'text');
        li.removeAttr('id');
        input.keydown(function(event) {
            switch( event.keyCode ) {
                case 27:
                    la.remove();
                    li.attr('id', 'selected');
                    resetCurrentShortcuts();
                    return false;
                case 13:
                    var subject = $('<span>').attr('class', 'subject');
                    subject.text(input.val());
                    input.replaceWith(subject);
                    la.attr('id', 'selected');
                    resetCurrentShortcuts();
                    return false;
                default:
                    return true;
            }
        });
        la.append(input);
        log("about to insert");
        li.after(la);
        input.focus();
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
        setCurrentShortcuts({});
        dlg.dialog('option', {
            'title': subject.text(),
            'buttons':  {
                "Ok": function() {
                    body.text(textarea.val());
                    dlg.dialog('close');
                },
                "Cancel": function() {
                    dlg.dialog('close');
                }
        }});
        dlg.dialog('open');
    },
    'writeToFile': function() {
        var str = "";
        str += "\\documentclass{srcartcl}\n";
        str += "\\begin{document}\n";
        str += generateOutput($('ul#tree'));
        str += "\\end{document}\n";
        writeToFile(str);
    },
    'toggleDebug': function() {
        $('div#output').toggleClass('hidden');
    }
};
var keyboardLayout = {
    78: 'down',
    82: 'up',
    84: 'right',
    83: 'left',
    69: 'editSubject',
    79: 'insertBelow',
    72: 'toggleHeadline',
    65: 'editBody',
    88: 'toggleDebug',
    80: 'writeToFile'

};

var currentShortcuts = globalShortcuts;
function setCurrentShortcuts( shortcuts ) {
    currentShortcuts = shortcuts;
}
function resetCurrentShortcuts() {
    currentShortcuts = globalShortcuts;
}
$(window).keydown(function(event) {
    var command = keyboardLayout[event.keyCode];
    if( command ) {
        log( "Command " + command );
        var commandSemantics = currentShortcuts[command];
        if( commandSemantics ) {
            commandSemantics($('li#selected'));
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
    $('#tree li').removeAttr('id');
    li.attr('id', 'selected');
}
function getSelection() {
    return $('#tree li#selected');
}

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

function generateOutput(ul) {
    var res = "";
    ul.children('li').each(function(ix, li) {
        li = $(li);
        var subject = li.children('span.subject');
        var body = li.children('div.body');
        if( li.hasClass('headline') ) {
            var depth = getHeadlineDepth(li);
            res += "\\" + sectionsByDepth[depth] + "{" + subject.text() + "}"
        } else
            res += "# " + subject.text();
        res += "\n" + body.text() + "\n";
        res += generateOutput(li.children(ul));
    });
    return res;
}

function writeToFile(data) {
    var filename = parameters['filename'];
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
    converter.writeString(data);
    converter.close(); // this closes foStream
    log("Done");
}

////////////////////////////////////////////////////////////////////////////////
// Utils

function repeatString(str, n) {
    var res = ""
    for(var i=0; i<n; i++) res += str;
    return res;
}

function log(msg) {
    $('div#output div').prepend($('<br>'));
    $('div#output div').prepend(msg);
}
