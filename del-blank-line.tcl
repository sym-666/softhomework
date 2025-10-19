#! /usr/bin/env wish

wm title . "实时去除空行工具"

if {$tcl_platform(platform) eq "windows"} {
    set fontName "微软雅黑"
} else {
    set fontName "Noto Sans CJK SC"
}
set textFont [list $fontName 10]
set labelFont [list $fontName 12 bold]

frame .leftFrame -relief ridge -borderwidth 2
frame .rightFrame -relief ridge -borderwidth 2

label .leftLabel -text "原始文本" -font $labelFont
label .rightLabel -text "去除空行后" -font $labelFont

text .leftText -width 40 -height 20 -wrap word -font $textFont
text .rightText -width 40 -height 20 -wrap word -font $textFont

scrollbar .leftScroll -command {.leftText yview}
scrollbar .rightScroll -command {.rightText yview}
.leftText configure -yscrollcommand {.leftScroll set}
.rightText configure -yscrollcommand {.rightScroll set}

grid .leftLabel .rightLabel -sticky w -padx 5 -pady 5
grid .leftFrame .rightFrame -sticky nsew -padx 5 -pady 5

grid .leftText .leftScroll -sticky nsew -in .leftFrame -padx 2 -pady 2
grid .rightText .rightScroll -sticky nsew -in .rightFrame -padx 2 -pady 2

grid columnconfigure . 0 -weight 1
grid columnconfigure . 1 -weight 1
grid rowconfigure . 1 -weight 1

grid columnconfigure .leftFrame 0 -weight 1
grid columnconfigure .leftFrame 1 -weight 0
grid rowconfigure .leftFrame 0 -weight 1

grid columnconfigure .rightFrame 0 -weight 1
grid columnconfigure .rightFrame 1 -weight 0
grid rowconfigure .rightFrame 0 -weight 1

proc processText {} {

    set originalText [.leftText get 1.0 end-1c]
    
    .rightText configure -state normal
    
    .rightText delete 1.0 end
    
    set lines [split $originalText "\n"]
    
    set filteredLines {}
    foreach line $lines {
        if {[string trim $line] ne ""} {
            lappend filteredLines $line
        }
    }
    

    set resultText [join $filteredLines "\n"]
    

    .rightText insert 1.0 $resultText
    

    .rightText configure -state disabled
}


.rightText configure -state disabled


proc setupRealTimeProcessing {} {

    bind .leftText <KeyRelease> {after 10 processText}
    bind .leftText <<Paste>> {after 50 processText}
    
    bind .leftText <ButtonRelease-1> {after 10 processText}
    bind .leftText <B1-Motion> {after 10 processText}
}


proc setupKeyboardBindings {} {
    bind .leftText <Control-a> {.leftText tag add sel 1.0 end-1c}
    bind .leftText <Control-c> {
        if {[catch {.leftText get sel.first sel.last} selectedText] == 0} {
            clipboard clear
            clipboard append $selectedText
        }
    }
    bind .leftText <Control-v> {
        if {[catch {selection get -displayof .leftText -selection CLIPBOARD} clipboardText] == 0} {
            .leftText insert insert $clipboardText
            processText
        }
    }
    bind .leftText <Control-x> {
        if {[catch {.leftText get sel.first sel.last} selectedText] == 0} {
            clipboard clear
            clipboard append $selectedText
            .leftText delete sel.first sel.last
            processText
        }
    }
    

    bind .rightText <Control-a> {.rightText tag add sel 1.0 end-1c}
    bind .rightText <Control-c> {
        if {[catch {.rightText get sel.first sel.last} selectedText] == 0} {
            clipboard clear
            clipboard append $selectedText
        }
    }
}

setupRealTimeProcessing
setupKeyboardBindings

wm geometry . 800x500

processText
