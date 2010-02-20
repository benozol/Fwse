
var parameters = [];
var trashcan;

$(function() {
    var x = $('li').first();
    setSelection(x);
    adjustSectioning($('ul#tree li'));

    trashcan = $('div#trashcan');
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
    $('#tree li').click(function() {
        setSelection($(this));
    });
    parameters = [];
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        var hash = hashes[i].split('=');
        parameters.push(hash[0]);
        parameters[hash[0]] = hash[1];
    }
    unsetCurrentShortcuts();
    if( parameters['filename'] ) {
        $('#filename').append(parameters['filename']);
        resetCurrentShortcuts();
    } else {
        var dialog = $('#fileDialog');
        dialog.dialog({
            'open': function() {
                $(this).children('input').focus();
            },
            'buttons': {
                'Ok': function() {
                    parameters['filename'] = $(this).children('input').val();
                    $('#filename').append(parameters['filename']);
                    resetCurrentShortcuts();
                    $(this).dialog('destroy');
                }
            }
        });
    }
});

////////////////////////////////////////////////////////////////////////////////
// Shortcuts

function createAt( x, defeatCallback ) {
    var la = $('<li>');
    var input = $('<input>').attr('name', 'subject').attr('type', 'text');
    la.append(input);
    la.append($('<span>').addClass('infos'));
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
    var elt = trashcan.children().first();
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

const globalShortcuts = {
    'down': function(li) {
        var la;
        var sublis = li.children('ul:visible').children();

        if( sublis.length > 0 )
            la = sublis.first();
        else if( li.next().length > 0 )
            la = li.next();
        else
            la = li.parents('li').first().next();

        if( la != undefined && la.length > 0 )
            setSelection( la );
    },
    'S-down': function(li) {
        var la = li.next();
        if( la.length == 1 )
            setSelection( la );
    },
    'up': function(li) {
        var la = li.prev();
        var sublis = li.prev().children('ul:visible').children();

        if( sublis.length > 0 )
            la = sublis.last();
        else if( li.prev().length > 0 )
            la = li.prev();
        else
            la = li.parents('li').first();

        if( la.length > 0 )
            setSelection( la );
    },
    'S-up': function( li ) {
        var la = li.prev();
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
        var str = "#" + $('#tree').html();
        str += "\\documentclass{srcartcl}\n";
        str += "\\begin{document}\n";
        str += generateOutput($('ul#tree'));
        str += "\\end{document}\n";
        writeToFile(str);
    },
    'toggleDebug': function() {
        $('div#output').toggleClass('hidden');
    },
    'parentize': function(li) {
        if( li.children('ul').children().length > 0 )
            return trace(undefined, "selected items has children");
        var ulConstruct = $('<ul>');
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
        li.children('ul').toggleClass('hidden');
        if( li.children('ul').hasClass('hidden') )
            li.children('span.infos').text( "... " + li.children('ul').children('li').length );
        else
            li.children('span.infos').text("");
    },
    'delete': function(li) {
        log("Delete ...");
        function delete_( choosing, nextSelection ) {
            choosing.remove();
            trashcan.append( choosing );
            setSelection( nextSelection );
            resetCurrentShortcuts();
        }
        setCurrentShortcuts("Deleting", {
            'cancel': resetCurrentShortcuts,
            'S-delete': function() {
                delete_( li.parents('ul').first(), li.parents('li').first() );
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
