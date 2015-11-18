///<reference path="Scripts/typings/q/Q.d.ts"/>
"use strict";
module ChelseaAppsTest {
    export class CSVFileReader {
        public static parseCsv(filePath: string): Q.Promise<string[][]> {
            if (!this.checkFileExtension(filePath)) throw new Error("The filepath supplied must be to a csv file");
            return this.getTextFromFilePath(filePath).then(
                (csvContent) => {
                    var lines = this.splitTextIntoLines(csvContent);
                    var valueRows = [];
                    for (var i = 0; i < lines.length; i++) {
                        valueRows.push(this.seperateLineIntoArray(lines[i]));
                    }
                    return valueRows;
                }
            );
        }

        public static checkHeaders(expectedHeaders: string[], csvContent: string[][]): boolean {
            var headersArray = csvContent[0];
            if (headersArray.length !== expectedHeaders.length) throw new Error("Headers not expected length");
            for (var i = 0; i < headersArray.length; i++) {
                var expected = expectedHeaders[i] || "";
                var actual = headersArray[i] || "";
                if (expected.toLowerCase().trim() !== actual.toLowerCase().trim()) {
                    return false;
                }
            }
            return true;
        }

        private static checkFileExtension(filePath: string): boolean {
            var fileExtension = filePath.substr(filePath.lastIndexOf('.') + 1);
            return fileExtension.toLowerCase() === "csv";
        }

        private static splitTextIntoLines(text: string): string[] {
            return text.split("\n");
        }

        private static seperateLineIntoArray(lineOfText: string) {
            var values = lineOfText.split(",");
            for (var i = 0; i < values.length; i++) {
                values[i] = values[i].trim();
            }
            return values;
        }

        private static getTextFromFilePath(filePath: string): Q.Promise<string> {
            return Q.Promise<string>(function (success, error, notify) {
                var request = new XMLHttpRequest();
                request.open("GET", filePath, true);
                request.onreadystatechange = function () {
                    if (request.readyState === 4) {
                        if (request.status === 200 || request.status === 0) {
                            success(request.responseText);
                        } else {
                            error("Not ok status");
                        }
                    }
                };
                request.send(null);
            });
        }
    }

    export class Triangle {
        public product: string;
        public dataPoints: TriangleDataPoint[];

        constructor(product: string) {
            this.dataPoints = [];
            this.product = product;
        }

        public addLines(triangeLines: TriangleLine[]): void {
            for (var i = 0; i < triangeLines.length; i++) {
                var datapoint = TriangleDataPoint.fromTriangleLine(triangeLines[i]);
                this.dataPoints.push(datapoint);
            }
        }

        public addDataPoint(dataPoint: TriangleDataPoint): void {
            this.dataPoints.push(dataPoint);
        }

        public clearDataPoints(): void {
            this.dataPoints = [];
        }

        public getName(): string {
            return this.product;
        }
    }

    export class TriangleDataPoint {
        originYear: number;
        developmentYear: number;
        incrementalValue: number;

        constructor(originYear: number, developmentYear: number, incrementalValue: number) {
            this.originYear = originYear;
            this.developmentYear = developmentYear;
            this.incrementalValue = incrementalValue;
        }

        public static fromTriangleLine(line: TriangleLine): TriangleDataPoint {
            var developmentYear = (line.developmentYear - line.originYear) + 1;
            return new TriangleDataPoint(line.originYear, developmentYear, line.incrementalValue);
        }
    }

    export class TriangleLine {
        product: string;
        originYear: number;
        developmentYear: number;
        incrementalValue: number;

        constructor(product: string, originYear: number, developmentYear: number, incrementalValue: number) {
            this.product = product;
            this.originYear = originYear;
            this.developmentYear = developmentYear;
            this.incrementalValue = incrementalValue;
        }

        public static fromRowValues(values: string[]): TriangleLine {
            if (!values || values.length !== 4) throw new Error("Values do not represent a triangle");
            var product = values[0];
            var originYear = parseInt(values[1]);
            var developmentYear = parseInt(values[2]);
            var incrementalValue = parseFloat(values[3]);
            return new TriangleLine(product, originYear, developmentYear, incrementalValue);
        }
    }

    export class OriginRange {
        startYear: number;
        developmentYears: number;

        constructor(startYear: number, developmentYears: number) {
            this.startYear = startYear;
            this.developmentYears = developmentYears;
        }
    }

    export class TriangleDataPresenter {
        element: HTMLElement;
        startYear: number;
        numberOfYears: number;
        triangles: Triangle[];

        constructor(triangles: Triangle[], element: HTMLElement) {
            this.element = element;
            var lowestYear = Number.MAX_VALUE;
            var highestYear = Number.MIN_VALUE;
            for (var i = 0; i < triangles.length; i++) {
                var triangle = triangles[i];
                for (var j = 0; j < triangle.dataPoints.length; j++) {
                    var dataPoint = triangle.dataPoints[j];
                    if (lowestYear > dataPoint.originYear) lowestYear = dataPoint.originYear;
                    if (highestYear < dataPoint.developmentYear) highestYear = dataPoint.developmentYear;
                }
            }
            this.startYear = lowestYear;
            this.numberOfYears = highestYear;
            this.triangles = triangles;
        }

        private establishOriginAndDevYearsForTriangles(triangles: Triangle[], startYear: number, numberOfYears: number): OriginRange[] {
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

        private generateCompleteTriangleDataForOrigin(triangle: Triangle, originYear: number, numberOfYears: number): Triangle {
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
                } else {
                    for (var k = 0; k < dataPointsToAdd.length; k++) {
                        returnTriangle.dataPoints.push(dataPointsToAdd[k]);
                    }
                }
            }
            return returnTriangle;
        }

        public outputTriangleData(): void {
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
    
    ChelseaAppsTest.CSVFileReader.parseCsv('http://localhost:43449/test.csv').then((values => {
        var element = document.getElementById('content');
        var expectedHeaders = ["Product", "Origin Year", "Development Year", "Incremental Value"];
        if (!ChelseaAppsTest.CSVFileReader.checkHeaders(expectedHeaders, values)) throw new Error("Headers incorrect!");
        var trianglesHashTable = {};
        for (var i = 1; i < values.length; i++) { //skip headers
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
    };