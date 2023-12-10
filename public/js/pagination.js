/* eslint-env browser */
/* global document */

function Pager(tableName, itemsPerPage) {
    'use strict';

    this.tableName = tableName;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.pages = 0;
    this.inited = false;

    this.showRecords = function(from, to) {
        let rows = document.getElementById(tableName).rows;

        // i starts from 1 to skip table header row
        for (let i = 1; i < rows.length; i++) {
            if (i < from || i > to) {
                rows[i].style.display = 'none';
            } else {
                rows[i].style.display = '';
            }
        }
        console.log(this.pages);
        if (this.pages <= 1) {
            document.querySelector('.' + tableName + '-pg-prev').display = "none";
            document.querySelector('.' + tableName + '-pg-next').display = "none";
        }
    };

    this.showPage = function(pageNumber) {
        if (!this.inited) {
            // Not initialized
            return;
        }

        let oldPageAnchor = document.getElementById(tableName + 'pg' + this.currentPage);
        //oldPageAnchor.className = 'pg-normal';
        oldPageAnchor.classList.remove('active');

        this.currentPage = pageNumber;
        let newPageAnchor = document.getElementById(tableName + 'pg' + this.currentPage);
        //newPageAnchor.className = 'active';
        newPageAnchor.classList.add('active');

        let from = (pageNumber - 1) * itemsPerPage + 1;
        let to = from + itemsPerPage - 1;
        this.showRecords(from, to);

        let pgNext = document.querySelector('.' + tableName + '-pg-next'),
            pgPrev = document.querySelector('.' + tableName + '-pg-prev');

        if (this.currentPage == this.pages) {
            pgNext.style.display = 'none';
        } else {
            pgNext.style.display = '';
        }

        if (this.currentPage === 1) {
            pgPrev.style.display = 'none';
        } else {
            pgPrev.style.display = '';
        }
    };

    this.prev = function() {
        if (this.currentPage > 1) {
            this.showPage(this.currentPage - 1);
        }
    };

    this.next = function() {
        if (this.currentPage < this.pages) {
            this.showPage(this.currentPage + 1);
        }
    };

    this.init = function() {
        let rows = document.getElementById(tableName).rows;
        let records = (rows.length - 1);

        this.pages = Math.ceil(records / itemsPerPage);
        this.inited = true;
    };

    this.showPageNav = function(pagerName, positionId) {
        if (!this.inited) {
            // Not initialized
            return;
        }

        let element = document.getElementById(positionId),
            pagerHtml = '<li onclick="' + pagerName + '.prev();" class="page-item page-link ' + tableName + '-pg-prev">&#171;</li>';

        for (let page = 1; page <= this.pages; page++) {
            pagerHtml += '<li id="' + tableName + 'pg' + page + '" class="page-item page-link" onclick="' + pagerName + '.showPage(' + page + ');">' + page + '</li>';
        }

        pagerHtml += '<li onclick="' + pagerName + '.next();" class="page-item page-link ' + tableName + '-pg-next">&#187;</li>';

        element.innerHTML = pagerHtml;
    };
}



//