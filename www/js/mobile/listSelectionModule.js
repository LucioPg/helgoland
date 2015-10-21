angular.module('listSelectionModule_mobile', ['n52.core.interface', 'n52.core.status'])
        .controller('ListSelectionMobileButtonCtrl', ['$scope', '$modal',
            function ($scope, $modal) {
                $scope.openListSelectionMobile = function () {
                    $modal.open({
                        animation: true,
                        templateUrl: 'templates/mobile/modal-list-selection-mobile.html',
                        controller: 'ModalListSelectionMobileCtrl'
                    });
                };
            }])
        .controller('ModalListSelectionMobileCtrl', ['$scope', '$modalInstance',
            function ($scope, $modalInstance) {
                $scope.modalInstance = $modalInstance;
                $scope.shipParams = [
                    {
                        type: 'platform',
                        header: 'listSelection_mobile.headers.ship'
                    },
                    {
                        type: 'track',
                        header: 'listSelection_mobile.headers.track'
                    },
                    {
                        type: 'phenomenon',
                        header: 'listSelection_mobile.headers.phenomenon'
                    }
                ];
                $scope.phenomenonParams = [
                    {
                        type: 'phenomenon',
                        header: 'listSelection_mobile.headers.phenomenon'
                    },
                    {
                        type: 'track',
                        header: 'listSelection_mobile.headers.track'
                    }
                ];

                $scope.close = function () {
                    $modalInstance.close();
                };
            }])
        .directive('swcListSelectionMobile', [
            function () {
                return {
                    restrict: 'E',
                    templateUrl: 'templates/mobile/accordion-list-selection.html',
                    scope: {
                        parameters: '='
                    },
                    controller: 'ListSelectionMobileCtrl'
                };
            }])
        .controller('ListSelectionMobileCtrl', ['$scope', 'mobileInterfaceService', 'mobilemapService', 'colorService',
            function ($scope, mobileInterfaceService, mobilemapService, colorService) {
                var url = "http://localhost:1080/";
                angular.forEach($scope.parameters, function (param, openedIdx) {
                    $scope.$watch('parameters[' + openedIdx + '].isOpen', function (newVal, oldVal) {
                        if (newVal) {
                            $scope.selectedParameterIndex = openedIdx;
                            // TODO nachfolger disablen und zurücksetzen
                            angular.forEach($scope.parameters, function (param, idx) {
                                if (idx > openedIdx) {
                                    param.isDisabled = true;
                                    delete param.selectedId;
                                    delete param.items;
                                }
                                if (idx >= openedIdx) {
                                    delete param.headerAddition;
                                }
                            });
                        }
                    });
                });

                $scope.createParams = function () {
                    var params = {};
//                    var params = {
//                        service: statusService.status.apiProvider.serviceID
//                    };
                    angular.forEach($scope.parameters, function (parameter) {
                        if (parameter.selectedId) {
                            params[parameter.type] = parameter.selectedId;
                        }
                    });
                    return params;
                };

                $scope.getItems = function (currParam) {
                    if (currParam.type === 'platform') {
                        mobileInterfaceService.getPlatforms(null, url, $scope.createParams()).success(function (data) {
                            currParam.items = data;
                        });
                    } else if (currParam.type === 'track') {
                        mobileInterfaceService.getTracks(null, url, $scope.createParams()).success(function (data) {
                            currParam.items = data;
                        });
                    } else if (currParam.type === 'phenomenon') {
                        mobileInterfaceService.getPhenomena(null, url, $scope.createParams()).success(function (data) {
                            currParam.items = data;
                        });
                    }
                };

                $scope.openNext = function (idx) {
                    $scope.parameters[idx].isDisabled = false;
                    $scope.selectedParameterIndex = idx;
                    $scope.parameters[idx].isOpen = true;
                    $scope.getItems($scope.parameters[idx]);
                };

                $scope.openItem = function (item) {
                    $scope.parameters[$scope.selectedParameterIndex].selectedId = item.id;
                    $scope.parameters[$scope.selectedParameterIndex].headerAddition = item.label;
                    if ($scope.selectedParameterIndex < $scope.parameters.length - 1) {
                        $scope.openNext($scope.selectedParameterIndex + 1);
                    } else {
                        mobileInterfaceService.getTimeseries(null, url, $scope.createParams()).success(function (timeseries) {
                            mobileInterfaceService.getTsData(timeseries.id, url, $scope.createParams()).success(function (data) {
                                mobilemapService.clearPaths();
                                mobilemapService.clearMarker();
                                createPath(timeseries, data);
                                createMarkers(timeseries, data);
                            });
                        });
                        $scope.$parent.modalInstance.close();
                    }
                };

                createPath = function (timeseries, data) {
                    var latlngs = [];
                    angular.forEach(data[timeseries.id].values, function (point) {
                        latlngs.push({
                            lat: point[3],
                            lng: point[2]
                        });
                    });
                    mobilemapService.addPath(timeseries.id, {
                        color: colorService.stringToColor(timeseries.id),
                        weight: 4,
                        latlngs: latlngs
                    }, true);
                };

                createMarkers = function (timeseries, data) {
                    angular.forEach(data[timeseries.id].values, function (point, idx) {
                        var time = point[0];
                        var value = point[1];
                        var uom = timeseries.uom;
                        var phenomenon = timeseries.parameters.phenomenon.label;
                        mobilemapService.addMarker('marker' + idx, {
                            latlngs: {
                                lat: point[3],
                                lng: point[2]
                            },
                            radius: 5,
                            color: '#FF0000',
                            message: phenomenon + ': ' + value + ' ' + uom + ' | ' + moment.unix(time/1000).format('DD.MM.YY HH:mm')
                        });
                    });
                };

                $scope.openNext(0);
            }])
        .service('mobileInterfaceService', ['$http', '$q', 'statusService', 'settingsService', 'styleService', 'utils',
            function ($http, $q, statusService, settingsService, styleService, utils) {

                var _createRequestConfigs = function (params) {
//                    if (angular.isUndefined(params)) {
//                        params = settingsService.additionalParameters;
//                    } else {
//                        angular.extend(params, settingsService.additionalParameters);
//                    }
                    return {
                        params: params,
                        cache: true
                    };
                };

                var _createIdString = function (id) {
                    return (id === null ? "" : "/" + id);
                };

                this.getPlatforms = function (id, apiUrl, params) {
                    return $http.get(apiUrl + 'platforms' + _createIdString(id), _createRequestConfigs(params));
                };

                this.getTracks = function (id, apiUrl, params) {
                    return $http.get(apiUrl + 'tracks' + _createIdString(id), _createRequestConfigs(params));
                };

                this.getPhenomena = function (id, apiUrl, params) {
                    return $http.get(apiUrl + 'phenomena' + _createIdString(id), _createRequestConfigs(params));
                };

                this.getTimeseries = function (id, apiUrl, params) {
                    if (angular.isUndefined(params))
                        params = {};
//                    params.expanded = true;
//                    params.force_latest_values = true;
//                    params.status_intervals = true;
//                    params.rendering_hints = true;
                    return $http.get(apiUrl + 'timeseries/' + _createIdString(id), _createRequestConfigs(params));
                };

                this.getTsData = function (id, apiUrl, timespan, extendedData) {
                    var params = {
                        timespan: timespan,
                        generalize: statusService.status.generalizeData || false,
                        expanded: true,
                        format: 'flot'
                    };
                    if (extendedData) {
                        angular.extend(params, extendedData);
                    }
                    return $http.get(apiUrl + 'timeseries' + _createIdString(id) + "/getData", _createRequestConfigs(params));
                };
            }]);