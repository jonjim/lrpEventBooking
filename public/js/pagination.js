function Pager(tableName, itemsPerPage) {
    'use strict';

    this.tableName = tableName;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.pages = 0;
    this.inited = false;

    this.showRecords = function (from, to) {
        let rows = document.getElementById(tableName).rows;

        // i starts from 1 to skip table header row
        for (let i = 1; i < rows.length; i++) {
            if (i < from || i > to) {
                rows[i].style.display = 'none';
            } else {
                rows[i].style.display = '';
            }
        }
    };

    this.showPage = function (pageNumber) {
        if (!this.inited || this.pages <= 1) {
            // Not initialized
            return;
        }
        let oldPageAnchor = document.getElementById('pg' + this.currentPage);
        oldPageAnchor.classList.remove('active');

        this.currentPage = pageNumber;
        let newPageAnchor = document.getElementById('pg' + this.currentPage);
        newPageAnchor.classList.add('active');

        let from = (pageNumber - 1) * itemsPerPage + 1;
        let to = from + itemsPerPage - 1;
        this.showRecords(from, to);

        let pgNext = document.querySelector('.pg-next');
        let pgPrev = document.querySelector('.pg-prev');
        

        // if (this.currentPage == this.pages) {
        //     pgNext.style.display = 'none';
        // } else {
        //     pgNext.style.display = '';
        // }

        // if (this.currentPage === 1) {
        //     pgPrev.style.display = 'none';
        // } else {
        //     pgPrev.style.display = '';
        // }
    };

    this.prev = function () {
        if (this.currentPage > 1) {
            this.showPage(this.currentPage - 1);
        }
    };

    this.next = function () {
        if (this.currentPage < this.pages) {
            this.showPage(this.currentPage + 1);
        }
    };

    this.init = function () {
        let rows = document.getElementById(tableName).rows;
        let records = (rows.length - 1);

        this.pages = Math.ceil(records / itemsPerPage);
        this.inited = true;
    };

    this.showPageNav = function (pagerName, positionId) {
        if (!this.inited) {
            // Not initialized
            return;
        }
        if (this.pages > 1){
            let element = document.getElementById(positionId)
                
            let pagerHtml = '<li id="' + pagerName + 'Prev" onclick="' + pagerName + '.prev();" class="page-item pg-prev"><span class="page-link">&#171;</span></li>';

            for (let page = 1; page <= this.pages; page++) {
                pagerHtml += '<li id="pg' + page + '" class="page-item" onclick="' + pagerName + '.showPage(' + page + ');"><span class="page-link">' + page + '</span></li>';
            }

            pagerHtml += '<li onclick="' + pagerName + '.next();" class="page-item pg-next"><span class="page-link">&#187;</span></li>';

            element.innerHTML = pagerHtml;
        }
    };
}