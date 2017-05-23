angular.module('portainer.services')
.factory('VolumeService', ['$q', 'Volume', 'VolumeHelper', 'ResourceControlService', 'UserService', 'TeamService', function VolumeServiceFactory($q, Volume, VolumeHelper, ResourceControlService, UserService, TeamService) {
  'use strict';
  var service = {};

  service.volumes = function() {
    var deferred = $q.defer();
    Volume.query().$promise
    .then(function success(data) {
      var volumes = data.Volumes || [];
      volumes = volumes.map(function (item) {
        return new VolumeViewModel(item);
      });
      deferred.resolve(volumes);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve volumes', err: err});
    });
    return deferred.promise;
  };

  service.volume = function(id) {
    var deferred = $q.defer();
    Volume.get({id: id}).$promise
    .then(function success(data) {
      var volume = new VolumeViewModel(data);
      deferred.resolve(volume);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve volume details', err: err});
    });
    return deferred.promise;
  };

  service.getVolumes = function() {
    return Volume.query({}).$promise;
  };

  service.remove = function(volume) {
    var deferred = $q.defer();

    Volume.remove({id: volume.Id}).$promise
    .then(function success(data) {
      if (data.message) {
        deferred.reject({ msg: data.message, err: data.message });
      }
      if (volume.ResourceControl && volume.ResourceControl.Type === 3) {
        return ResourceControlService.deleteResourceControl(volume.ResourceControl.Id);
      }
    })
    .then(function success() {
      deferred.resolve();
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to remove volume', err: err });
    });

    return deferred.promise;
  };

  service.createVolumeConfiguration = function(name, driver, driverOptions) {
    var volumeConfiguration = {
      Name: name,
      Driver: driver,
      DriverOpts: VolumeHelper.createDriverOptions(driverOptions)
    };
    return volumeConfiguration;
  };

  service.createVolume = function(volumeConfiguration) {
    var deferred = $q.defer();
    Volume.create(volumeConfiguration).$promise
    .then(function success(data) {
      if (data.message) {
        deferred.reject({ msg: data.message });
      } else {
        var volume = new VolumeViewModel(data);
        deferred.resolve(volume);
      }
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to create volume', err: err });
    });
    return deferred.promise;
  };

  service.createVolumes = function(volumeConfigurations) {
    var createVolumeQueries = volumeConfigurations.map(function(volumeConfiguration) {
      return service.createVolume(volumeConfiguration);
    });
    return $q.all(createVolumeQueries);
  };

  service.createXAutoGeneratedLocalVolumes = function (x) {
    var createVolumeQueries = [];
    for (var i = 0; i < x; i++) {
      createVolumeQueries.push(service.createVolume({}));
    }
    return $q.all(createVolumeQueries);
  };

  return service;
}]);
