function sort (list, criteria) {
    for(let i = 0; i < list.length; i++) {
        let smallestElement;

        for(let j = 0 + i; j < list.length; j++) {
            if (smallestElement === undefined) {
                smallestElement = j;
            } else if (list[smallestElement][criteria] > list[j][criteria]) { 
                smallestElement = j;
            }
        }

        let currentElement = list[i];
        list[i] = list[smallestElement];
        list[smallestElement] = currentElement; 
    }

    return list;
};

module.exports = { sort }