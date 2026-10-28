#! /usr/bin/env tclsh
set total_lines 0
set extensions {".ts" ".vue" ".cs" ".tsx"}

proc count_lines {file} {
    set count 0
    if {[catch {open $file r} fid]} {
        return 0
    }
    while {[gets $fid line] >= 0} {
        if {[string trim $line] ne ""} {
            incr count
        }
    }
    close $fid
    return $count
}

proc process_directory {dir} {
    global total_lines extensions
    set dir_lines 0
    set file_list {}
    
    foreach file [glob -nocomplain -dir $dir *] {
        if {[file isdirectory $file]} {
            process_directory $file
        } else {
            set ext [file extension $file]
            if {$ext in $extensions} {
                set lines [count_lines $file]
                lappend file_list [list [file tail $file] $lines]
                incr dir_lines $lines
                incr total_lines $lines
            }
        }
    }
    
    if {[llength $file_list] > 0} {
        puts "$dir："
        foreach item $file_list {
            puts "   [lindex $item 0]：[lindex $item 1]"
        }
        puts "   小计：$dir_lines"
        puts ""
    }
}

process_directory "."
puts "总行数：$total_lines"
