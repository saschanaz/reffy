/* File generated with rollup.js, do not edit directly! See source code in src/browserlib */
'use strict';

/**
 * Extract the list of WebIDL definitions in the current spec
 *
 * @function
 * @public 
 * @return {Promise} The promise to get a dump of the IDL definitions, or
 *   an empty string if the spec does not contain any IDL.
 */
function extractWebidl (doc) {
    return {
        doc,
        ...extractRespecIdl(doc)
    };
}


/**
 * Extract IDL definitions from a ReSpec spec, and in practice from
 * most other specs as well.
 *
 * The function tries all known patterns used to define IDL content, making
 * sure that it only extracts elements once.
 */
function extractRespecIdl(document) {
    // IDL filter voluntarily similar to that defined in Respec to exclude
    // IDL defined with an `exclude` class:
    // https://github.com/w3c/respec/blob/develop/src/core/webidl-index.js#L34
    // https://github.com/w3c/respec/blob/develop/src/core/utils.js#L100
    const nonNormativeSelector =
        '.informative, .note, .issue, .example, .ednote, .practice';

    // Helper function that trims individual lines in an IDL block,
    // removing as much space as possible from the beginning of the page
    // while preserving indentation. Rules followed:
    // - Always trim the first line
    // - Remove whitespaces from the end of each line
    // - Replace lines that contain spaces with empty lines
    // - Drop same number of leading whitespaces from all other lines
    const trimIdlSpaces = idl => {
        const lines = idl.trim().split('\n');
        const toRemove = lines
            .slice(1)
            .filter(line => line.search(/\S/) > -1)
            .reduce(
                (min, line) => Math.min(min, line.search(/\S/)),
                Number.MAX_VALUE);
        return lines
            .map(line => {
                let firstRealChat = line.search(/\S/);
                if (firstRealChat === -1) {
                    return '';
                }
                else if (firstRealChat === 0) {
                    return line.replace(/\s+$/, '');
                }
                else {
                    return line.substring(toRemove).replace(/\s+$/, '');
                }
            })
            .join('\n');
    };

    const idlEl = document.querySelector('#idl-index pre') ||
        document.querySelector('#chapter-idl pre');  // Used in SVG 2 draft

    // TEMP (2019-07-25): Don't use the IDL index as long as we cannot run
    // the latest version of ReSpec, because the pinned version fails to
    // parse recent IDL constructs, see:
    // https://github.com/tidoust/reffy/issues/134
    // https://github.com/tidoust/reffy-reports/issues/34
    /*if (idlEl && false) {
        return idlEl.textContent;
    }*/

    let queries = [
        'pre.idl:not(.exclude):not(.extract):not(#actual-idl-index)',
        'pre:not(.exclude):not(.extract) > code.idl-code:not(.exclude):not(.extract)',
        'pre:not(.exclude):not(.extract) > code.idl:not(.exclude):not(.extract)',
        'div.idl-code:not(.exclude):not(.extract) > pre:not(.exclude):not(.extract)',
        'pre.widl:not(.exclude):not(.extract)'
    ];
    queries = queries.concat(queries.map(q => q.replace(/pre/g, "xmp")));

    const blocks = queries
        .map(sel => [...document.querySelectorAll(sel)])
        .reduce((res, elements) => res.concat(elements), [])
        .filter(el => el !== idlEl)
        .filter(el => !el.previousElementSibling || el.previousElementSibling.id !== 'idl-index')
        .filter((el, idx, self) => self.indexOf(el) === idx)
        .filter(el => !el.closest(nonNormativeSelector))
        // .map(el => el.cloneNode(true)) we need it to be inside the tree
        .map(el => {
            const header = el.querySelector('.idlHeader');
            if (header) {
                header.remove();
            }
            const tests = el.querySelector('details.respec-tests-details');
            if (tests) {
                tests.remove();
            }
            return el;
        });
    /** @type {string[]} */
    let idl = blocks
        .map(el => trimIdlSpaces(el.textContent));
    return { blocks, idl };
}

module.exports = extractWebidl;
