$=jQuery;

$(function () {
    $("[data-toggle='tooltip']").tooltip();
    // Change to this was done as part of E1788_OSS_project_Maroon_Heatmap_fixes
    //
    // scoreTable was assigned to as classes for the table which required to be sortable
    // tablesorter is initialised on all the elements having class scoreTable
    //
    // fix comment end
    $(".scoresTable").tablesorter();
});

var lesser = false;
// Function to sort the columns based on the total review score
function col_sort(m) {
    lesser = !lesser
    // Swaps two columns of the table
    jQuery.moveColumn = function (table, from, to) {
        var rows = jQuery('tr', table);
        var hidden_child_row = table.find('tr.tablesorter-childRow');
        hidden_child_row.each(function () {
            inner_table = jQuery(this).find('table.tbl_questlist')
            hidden_table = inner_table.eq(0).find('tr')
            hidden_table.eq(from - 1).detach().insertBefore(hidden_table.eq(to - 1));
            if (from - to > 1) {
                hidden_table.eq(to - 1).detach().insertAfter((hidden_table.eq(from - 2)));
            }
        });


        var cols;
        rows.each(function () {
            cols = jQuery(this).children('th, td');
            cols.eq(from).detach().insertBefore(cols.eq(to));
            if (from - to > 1) {
                cols.eq(to).detach().insertAfter((cols.eq(from - 1)));
            }
        });
    }

    // Gets all the table with the class "tbl_heat"
    var tables = $("table.tbl_heat");
    // Get all the rows with the class accordion-toggle
    var tbr = tables.eq(m).find('tr.accordion-toggle');
    // Get the cells from the last row of the table
    var columns = tbr.eq(tbr.length - 1).find('td');
    // Init an array to hold the review total
    var sum_array = [];
    // iterate through the rows and calculate the total of each review
    for (var l = 2; l < columns.length - 2; l++) {
        var total = 0;
        for (var n = 0; n < tbr.length; n++) {
            var row_slice = tbr.eq(n).find('td');
            if (parseInt(row_slice[l].innerHTML) > 0) {
                total = total + parseInt(row_slice[l].innerHTML)
            }
        }
        sum_array.push(total)
    }

    // The sorting algorithm
    for (var i = 3; i < columns.length - 2; i++) {
        var j = i;
        while (j > 2 && compare(sum_array[j - 2], sum_array[j - 3], lesser)) {
            var tmp
            tmp = sum_array[j - 3]
            sum_array[j - 3] = sum_array[j - 2]
            sum_array[j - 2] = tmp
            jQuery.moveColumn($("table.tbl_heat").eq(m), j, j - 1);
            // This part is repeated since the table is updated
            tables = $("table.tbl_heat")
            tbr = tables.eq(m).find('tr.accordion-toggle');
            columns = tbr.eq(tbr.length - 1).find('td')
            j = j - 1;
        }
    }
}

// Function to return boolean based on lesser or greater operator
function compare(a, b, less) {
    if (less) {
        return a < b
    } else {
        return a > b
    }
}

// Revisions In MARCH 2021 FOR E2100 Tagging Report for Students Below This Line.
/**************************** GLOBAL SYMBOLS AND PREFIXES **********************************/

// Symbols added for users who cannot see the R/G Color spectrum well. Note that white spacing is added here as well.
const symNoTag = "  " + "\u2298";        // Unicode universal "NO" circle-line symbol
const symTagNotDone = " " + "\u26A0";   // Unicode Symbol Representing to-do ("Warning" Symbol)
const symTagDone = " " + "\u2714";       // Unicode Heavy Check-Mark

/********************************** ACTION HANDLERS ****************************************/

// Initialize Tag Report Heat grid and hide if empty.
function tagActionOnLoad() {
    let tagPrompts = getTagPrompts();
    // Hide heatgrid and don't waste cycles counting/drawing, if no tags exist.
    if(tagPrompts.length == 0) {
        document.getElementById("tagHeatMap").style.display = 'none';
    } else {
        let countMap = calcTagRatio(tagPrompts);
        let rowData =  getRowData();
        drawTagGrid(rowData);
        updateTagsFraction(countMap);
    }
}

// Update Tag Report Heat grid each time a tag is changed
function tagActionOnUpdate() {
    let tagPrompts = getTagPrompts();
    let countMap = calcTagRatio(tagPrompts);
    updateTagGrid(tagPrompts);
    updateTagsFraction(countMap);
}

/********************************** ELEMENT GETTERS ****************************************/

// Simple query of all review tags and put references into a one d vector.
function getTagPrompts() {
    return document.getElementsByName("tag_checkboxes[]");
}

// Populate an array with all review rows, their question and review number, whether they have tag prompts,
// and a reference to the tag prompts.
function getRowData() {
    // Get all valid review rows
    let rowsList = $("[id^=rr]");
    // Set up matrix of questionNumber, reviewNumber, hasTag?, and pointer to tags if true
    let rowData = new Array(rowsList.length);
    $.each(rowsList, function(i) {
        rowData[i] = new Map();
        //Round Number
        rowData[i].set('round_num', $( this ).data("round"));
        // Question Number
        rowData[i].set('question_num', $( this ).data("qnum"));
        // Review Number
        rowData[i].set('review_num',$( this ).data("rnum"));
        // Has tag bool?
        rowData[i].set('has_tag',$( this ).data("hastag"));
        // Reference to tag objects
        if (rowData[i].get('has_tag') == true) {
            rowData[i].set('tag_list', $( this ).find('input[name^="tag_checkboxes"]'));
        }
    });
    return rowData;
}

/********************************** ELEMENT CHANGERS/UPDATERS ****************************************/

// Updates the tags complete fraction at the top of the tag heat grid
function updateTagsFraction(countMap) {
    // Get element to be updated
    let cell = document.getElementById("tagsSuperNumber");
    // Set text value with ratio
    cell.innerText = countMap.get("onTags") + "/" + countMap.get("total");
    // Set background color class based on ratio
    cell.className = "c"+countMap.get("ratioClass").toString();
}

// Updates the Review Tag Heat Grid each time a tag is changed
function updateTagGrid(tagPrompts){
    for(let i = 0; i< tagPrompts.length; ++i) {
        // Look up the heatmap cell associated with this tag
        let tempId = tagPrompts[i].getAttribute("data-tagheatmapid");
        // Get the cell object from the document
        let gridCell = document.getElementById(tempId);
        // Update the heatgrid cell based on the value of this tag.
        if(tagPrompts[i].value == 0) {
            // Change Cell Color ("NOT DONE")
            gridCell.setAttribute("class", "c1");
            // Replace Unicode Icon
            gridCell.innerText = gridCell.innerText.replace(/[\u{0080}-\u{FFFF}]/u, symTagNotDone);
        }
        else {
            // Change Cell color ("DONE")
            gridCell.setAttribute("class", "c5");
            // Replace unicode icon
            gridCell.innerText = gridCell.innerText.replace(/[\u{0080}-\u{FFFF}]/u, symTagDone);
        }
    }
}

// Expand or collapse the heatgrid rows which make up the Map of tags.
function toggleHeatGridRows() {
    $("[id^=hg_row]").each(function () {
        if($( this ).css("display") === "none") {
            $( this ).css("display", "");
        }
        else {
            $( this ).css("display", "none");
        }
    });
}

/********************************** ELEMENT/CODE GENERATORS ****************************************/

// Renders the review tag heatgrid table based on the review rowData array.
function drawTagGrid(rowData) {
    //Configure text of tooltip Legend
    let tooltipText = "Color Legend:\nGrey: no tags available\nRed: tag not complete\nGreen: tag complete.";
    let headerTooltipText = "Tag Fraction Color Scaled by:\nRed: 0-30% tags completed\nOrange: 30-60% tags completed\nYellow: 60-99% Tags Completed\nGreen: All tags completed";

    // Handle multi-round reviews and initialize prefix which will become "Round # -- " if multiple rounds
    let numRounds = countRounds(rowData);
    let roundPrefix = "";

    // Load table object
    let table = document.getElementById("tag_heat_grid");

    // Set basic table attributes
    let gridWidth = getGridWidth(rowData);

    //create the header
    let thead = table.createTHead();
    let row = thead.insertRow();
    row.setAttribute("class", "hide-scrollbar tablesorter-headerRow");

    // Create "Tags Completed:" Cell
    let th = document.createElement("th");
    let text = document.createTextNode("\u2195 Tags Completed");
    th.setAttribute("id", "tagsSuperLabel");
    th.colSpan = 3;
    addToolTip(th, "Click to collapse/expand");
    th.appendChild(text);
    row.appendChild(th);

    // create "# / #" Cell showing number of completed tags (initialize as 0 / 0 for now)
    th = document.createElement("th");
    text = document.createTextNode("0/0");
    th.setAttribute("id", "tagsSuperNumber");
    th.colSpan = 2;
    addToolTip(th, headerTooltipText);
    th.appendChild(text);
    row.appendChild(th);
    row.setAttribute("onClick", "toggleHeatGridRows()");

    //create table body
    let tbody = table.appendChild(document.createElement('tbody'));
    let priorQuestionNum = -1;
    let roundNum = 1;
    for(let rIndex = 0; rIndex < rowData.length; ++rIndex) {
        let trow = tbody.insertRow();
        // Handle the backend inconsistency, Question Indices start with One and Review Indices start with Zero
        let questionNum = rowData[rIndex].get('question_num');
        let reviewNum = rowData[rIndex].get('review_num') + 1;

        // If this is a new question number, add a row indicating a new question.
        if(questionNum !== priorQuestionNum) {
            if(priorQuestionNum !== -1 && priorQuestionNum > questionNum) { ++roundNum; }
            // Update prior question index
            priorQuestionNum = questionNum;
            // Draw a "Question: # " Row that spans all columns
            let cell = trow.insertCell();
            cell.colSpan = gridWidth;
            cell.className = "tag_heat_grid_criterion";
            addToolTip(cell, tooltipText);
            trow.id = "hg_row" + questionNum + "_" + reviewNum;
            trow.setAttribute("data-questionnum", questionNum);
            if(numRounds > 1) {
                roundPrefix = "Round " + roundNum + " -- ";
            }
            let text = document.createTextNode( roundPrefix + "Question " + questionNum);
            cell.appendChild(text);
            // Initialize new row to be used by the inner loop for reviews.
            trow = tbody.insertRow();
            let temp = reviewNum - 1;
            trow.id = "hg_row" + questionNum + "_" + temp;
        }

        // If not a new question, continue to populate rows with cells
        trow.id = "hg_row" + questionNum + "_" + reviewNum;
        trow.setAttribute("data-questionnum", questionNum);
        for(let cIndex = 0; cIndex < gridWidth; ++cIndex) {
            let cell = trow.insertCell();
            // Set the text value of the grid cell
            let innerText = "R." + reviewNum;
            // If review doesn't have tag prompts
            if(rowData[rIndex].get('has_tag') == false){
                cell.setAttribute("class", "c0");
                innerText += symNoTag;
            }
            else {
                let idString = "tag_heatmap_id_" + rIndex + "_" + cIndex;
                cell.setAttribute("id", idString);
                if(rowData[rIndex].get('tag_list').get(cIndex).value == 0) {
                    // Set color as failing
                    cell.setAttribute("class", "c1");
                    innerText += symTagNotDone;
                }
                else {
                    // Set color as successful
                    cell.setAttribute("class", "c5");
                    innerText += symTagDone;
                }
                rowData[rIndex].get('tag_list').get(cIndex).setAttribute("data-tagheatmapid", idString);
            }
            let text = document.createTextNode(innerText);
            //add to table
            cell.appendChild(text);
            addToolTip(cell, tooltipText);
        }
    }
}

// Adds a tooltip to Element "element" that contains the "text"
function addToolTip(element, text) {
    element.setAttribute("data-toggle", "tooltip");
    element.setAttribute("title", text);
}

/********************************** MATHEMATICS HELPERS ****************************************/

// Find the largest number of tags in a review, if any exist, and return the width that the grid should be drawn to.
function getGridWidth(rowData) {
    let gridWidth = 0;
    for(let i=0; i<rowData.length; ++i) {
        if(rowData[i].get('has_tag') == true && rowData[i].get('tag_list').length > gridWidth) {
            gridWidth =  rowData[i].get('tag_list').length;
        }
    }
    return gridWidth;
}

// Returns as a HashMap the count of all, on, and off tags, and the ratio of done to total in decimal and
// (special rounding) integer form to associate with existing heatgrid color classes.
function calcTagRatio(tagPrompts){
    let countMap = new Map();
    let offTags = 0;
    let onTags = 0;
    let length = tagPrompts.length;
    let ratio = 0;
    let ratioClass = 0;
    for (let index = 0; index < tagPrompts.length; ++index) {
        if (tagPrompts[index].value == 0) {
            ++offTags;
        } else {
            ++onTags;
        }
    }
    countMap.set("onTags", onTags);
    countMap.set("offTags", offTags);
    countMap.set("total", length);

    // Compute ratio as decimal
    ratio = onTags / length;

    // Calculate the ratio class. This is used to look up CSS color mapping classes that range {0 .. 5}
    // Scale ratio to 0 <= ratio <= 4
    ratioClass = ratio*4;

    // increment ratio so the range is 1 <= ratio_class <= 5
    ++ratioClass;

    // round ratioClass down to nearest integer
    ratioClass = Math.floor(ratioClass);

    // For our purposes, ratio_class should fall in the range { 1,2,3,5 } (skips class 4).
    if(ratioClass === 4) { --ratioClass; }

    // Add values to the hashmap
    countMap.set("ratioClass", ratioClass);
    countMap.set("ratioDecimal", ratio);
    return countMap;
}

// Determine number of rounds in this review dataset
// For now, because of the broken round numbers in the backend, use changes in question number to find rounds
function countRounds(rowData) {
    let numRounds = 1;
/*    let round = 0;
    for(const row of rowData) {
        if(row.get('round_num')>round) {
            ++numRounds;
        }
    }*/
    let questionNum = 1;
    for(const row of rowData) {
        if(row.get('question_num') < questionNum) {
            ++numRounds;
        }
        questionNum = row.get('question_num');

    }
    return numRounds;
}
