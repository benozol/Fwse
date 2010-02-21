#!/bin/sh

import os
from pyinotify import *


print sys.argv
htmlfilename = sys.argv[1]
filename = sys.argv[2]

os.system('firefox file://%s#"%s"' % (htmlfilename, filename))

wm = WatchManager()

class PTmp(ProcessEvent):
    def __init__(self, *args, **kwargs):
        ProcessEvent.__init__(self, *args, **kwargs)
        self.last = None
    def process_IN_MODIFY(self, event):
        line = open(filename).read()
        if self.last != line:
            os.system('latex %s' % filename)
            self.last = line

notifier = Notifier(wm, PTmp())
wm.add_watch(filename, IN_MODIFY)
notifier.loop()
