///<reference path="Scripts/typings/q/Q.d.ts"/>
"use strict";
var ChelseaAppsTest;
(function (ChelseaAppsTest) {
    class CSVFileReader {
        static parseCsv(filePath) {
            if (!this.checkFileExtension(filePath))
                throw new Error("The filepath supplied must be to a csv file");
            return this.getTextFromFilePath(filePath).then((csvContent) => {
                var lines = this.splitTextIntoLines(csvContent);
                var valueRows = [];
                for (var i = 0; i < lines.length; i++) {
                    valueRows.push(this.seperateLineIntoArray(lines[i]));
                }
                return valueRows;
            });
        }
        static checkHeaders(expectedHeaders, csvContent) {
            var headersArray = csvContent[0];
            if (headersArray.length !== expectedHeaders.length)
                throw new Error("Headers not expected length");
            for (var i = 0; i < headersArray.length; i++) {
                var expected = expectedHeaders[i] || "";
                var actual = headersArray[i] || "";
                if (expected.toLowerCase().trim() !== actual.toLowerCase().trim()) {
                    return false;
                }
            }
            return true;
        }
        static checkFileExtension(filePath) {
            var fileExtension = filePath.substr(filePath.lastIndexOf('.') + 1);
            return fileExtension.toLowerCase() === "csv";
        }
        static splitTextIntoLines(text) {
            return text.split("\n");
        }
        static seperateLineIntoArray(lineOfText) {
            var values = lineOfText.split(",");
            for (var i = 0; i < values.length; i++) {
                values[i] = values[i].trim();
            }
            return values;
        }
        static getTextFromFilePath(filePath) {
            return Q.Promise(function (success, error, notify) {
                var request = new XMLHttpRequest();
                request.open("GET", filePath, true);
                request.onreadystatechange = function () {
                    if (request.readyState === 4) {
                        if (request.status === 200 || request.status === 0) {
                            success(request.responseText);
                        }
                        else {
                            error("Not ok status");
                        }
                    }
                };
                request.send(null);
            });
        }
    }
    ChelseaAppsTest.CSVFileReader = CSVFileReader;
    class Triangle {
        constructor(product) {
            this.dataPoints = [];
            this.product = product;
        }
        addLines(triangeLines) {
            for (var i = 0; i < triangeLines.length; i++) {
                var datapoint = TriangleDataPoint.fromTriangleLine(triangeLines[i]);
                this.dataPoints.push(datapoint);
            }
        }
        addDataPoint(dataPoint) {
            this.dataPoints.push(dataPoint);
        }
        clearDataPoints() {
            this.dataPoints = [];
        }
        getName() {
            return this.product;
        }
    }
    ChelseaAppsTest.Triangle = Triangle;
    class TriangleDataPoint {
        constructor(originYear, developmentYear, incrementalValue) {
            this.originYear = originYear;
            this.developmentYear = developmentYear;
            this.incrementalValue = incrementalValue;
        }
        static fromTriangleLine(line) {
            var developmentYear = (line.developmentYear - line.originYear) + 1;
            return new TriangleDataPoint(line.originYear, developmentYear, line.incrementalValue);
        }
    }
    ChelseaAppsTest.TriangleDataPoint = TriangleDataPoint;
    class TriangleLine {
        constructor(product, originYear, developmentYear, incrementalValue) {
            this.product = product;
            this.originYear = originYear;
            this.developmentYear = developmentYear;
            this.incrementalValue = incrementalValue;
        }
        static fromRowValues(values) {
            if (!values || values.length !== 4)
                throw new Error("Values do not represent a triangle");
            var product = values[0];
            var originYear = parseInt(values[1]);
            var developmentYear = parseInt(values[2]);
            var incrementalValue = parseFloat(values[3]);
            return new TriangleLine(product, originYear, developmentYear, incrementalValue);
        }
    }
    ChelseaAppsTest.TriangleLine = TriangleLine;
    class OriginRange {
        constructor(startYear, developmentYears) {
            this.startYear = startYear;
            this.developmentYears = developmentYears;
        }
    }
    ChelseaAppsTest.OriginRange = OriginRange;
    class TriangleDataPresenter {
        constructor(triangles, element) {
            this.element = element;
            var lowestYear = Number.MAX_VALUE;
            var highestYear = Number.MIN_VALUE;
            for (var i = 0; i < triangles.length; i++) {
                var triangle = triangles[i];
                for (var j = 0; j < triangle.dataPoints.length; j++) {
                    var dataPoint = triangle.dataPoints[j];
                    if (lowestYear > dataPoint.originYear)
                        lowestYear = dataPoint.originYear;
                    if (highestYear < dataPoint.developmentYear)
                        highestYear = dataPoint.developmentYear;
                }
            }
            this.startYear = lowestYear;
            this.numberOfYears = highestYear;
            this.triangles = triangles;
        }
        establishOriginAndDevYearsForTriangles(triangles, startYear, numberOfYears) {
            var originRanges = [];
            for (var i = this.startYear; i < startYear + numberOfYears; i++) {
                var year = i;
                var maxDevYearsForOriginYear = Number.MIN_VALUE;
                //Trying to find highest development year for the current origin year.
                for (var l = 0; l < triangles.length; l++) {
                    for (var m = 0; m < triangles[l].dataPoints.length; m++) {
                        if (triangles[l].dataPoints[m].originYear === i) {
                            if (maxDevYearsForOriginYear < triangles[l].dataPoints[m].developmentYear)
                                maxDevYearsForOriginYear = triangles[l].dataPoints[m].developmentYear;
                        }
                    }
                }
                originRanges.push(new OriginRange(year, maxDevYearsForOriginYear));
            }
            return originRanges;
        }
        generateCompleteTriangleDataForOrigin(triangle, originYear, numberOfYears) {
            var name = triangle.getName();
            var returnTriangle = new Triangle(name);
            for (var i = 1; i <= numberOfYears; i++) {
                var datapoints = triangle.dataPoints;
                var dataPointsToAdd = [];
                for (var j = 0; j < datapoints.length; j++) {
                    var point = datapoints[j];
                    if (point.originYear === originYear && point.developmentYear === i) {
                        dataPointsToAdd.push(point);
                    }
                }
                if (dataPointsToAdd.length === 0) {
                    var devYear = i;
                    var blankDataPoint = new TriangleDataPoint(originYear, devYear, 0);
                    returnTriangle.addDataPoint(blankDataPoint);
                }
                else {
                    for (var k = 0; k < dataPointsToAdd.length; k++) {
                        returnTriangle.dataPoints.push(dataPointsToAdd[k]);
                    }
                }
            }
            return returnTriangle;
        }
        outputTriangleData() {
            var originresults = this.establishOriginAndDevYearsForTriangles(this.triangles, this.startYear, this.numberOfYears);
            var results = [];
            for (var n = 0; n < this.triangles.length; n++) {
                var triangleResults = [];
                for (var o = 0; o < originresults.length; o++) {
                    var completeTriangle = this.generateCompleteTriangleDataForOrigin(this.triangles[n], originresults[o].startYear, originresults[o].developmentYears);
                    triangleResults.push(completeTriangle);
                }
                results.push(triangleResults);
            }
            var outputLines = [];
            var firstLine = this.startYear + ", " + this.numberOfYears;
            outputLines.push(firstLine);
            for (var p = 0; p < results.length; p++) {
                var productName = results[p][0].product;
                var outputLine = productName;
                for (var i = 0; i < results[p].length; i++) {
                    var points = results[p][i].dataPoints;
                    var total = 0;
                    for (var j = 0; j < points.length; j++) {
                        var point = points[j];
                        total = total + point.incrementalValue;
                        outputLine = outputLine + ", " + total;
                    }
                }
                outputLines.push(outputLine);
            }
            for (var k = 0; k < outputLines.length; k++) {
                var e = document.createElement('div');
                this.element.appendChild(e);
                e.innerText = outputLines[k];
            }
        }
    }
    ChelseaAppsTest.TriangleDataPresenter = TriangleDataPresenter;
    ChelseaAppsTest.CSVFileReader.parseCsv('http://localhost:43449/test.csv').then((values => {
        var element = document.getElementById('content');
        var expectedHeaders = ["Product", "Origin Year", "Development Year", "Incremental Value"];
        if (!ChelseaAppsTest.CSVFileReader.checkHeaders(expectedHeaders, values))
            throw new Error("Headers incorrect!");
        var trianglesHashTable = {};
        for (var i = 1; i < values.length; i++) {
            var triangle = ChelseaAppsTest.TriangleLine.fromRowValues(values[i]);
            trianglesHashTable[triangle.product] = trianglesHashTable[triangle.product] || [];
            trianglesHashTable[triangle.product].push(triangle);
        }
        var triangles = [];
        Object.keys(trianglesHashTable).forEach(function (product) {
            var values = trianglesHashTable[product];
            var triangle = new ChelseaAppsTest.Triangle(product);
            triangle.addLines(values);
            triangles.push(triangle);
        });
        var triangleDataPresenter = new ChelseaAppsTest.TriangleDataPresenter(triangles, element);
        triangleDataPresenter.outputTriangleData();
    })).catch(function (err) {
        console.log(err);
        throw err;
    });
})(ChelseaAppsTest || (ChelseaAppsTest = {}));
;
//# sourceMappingURL=app.js.map