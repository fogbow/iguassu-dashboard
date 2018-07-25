'use strict';

/**
 * @ngdoc function
 * @name ArrebolApp.controller:AuthCtrl
 * @description
 * # AuthCtrl
 * Controller of the ArrebolApp
 */
angular.module('ArrebolControllers').controller(
  'AuthCtrl',
  function ($rootScope, $scope, $location, toastr, Session, AuthenticationService, ExternalOAuthService, $window) {

    $scope.username = undefined;
    $scope.password = undefined;
    $scope.authType = 'not-refreshed';
	  $scope.userRecentlyGotOAuthToken = false;

	  var checkIfUrlHasAuthorizationCode = function () {
		  let currentUrl = $location.$$absUrl;
		  let re = /code=[a-zA-Z0-9.]+(?=#!)/;
		  let regexAns = re.exec(currentUrl);
		  if (regexAns !== null && typeof regexAns[0] === "string" && !$scope.userRecentlyGotOAuthToken) {
			  let splittedRegexAns = regexAns[0].split("=");
			  let authorizationCode = splittedRegexAns[1];
			  return authorizationCode;
		  }
	  };

	  var doLoginSuccessCallBack = function (res) {
		  $scope.userRecentlyGotOAuthToken = true;
		  let userToken = res.token ? res.token : res.data ? res.data.accessToken : null; // key is token when response comes
		                                                          // from Iguassu but is accesToken when comes from OwnCloud
		  Session.createTokenSession($scope.username, userToken);
		  $location.path('/tasks');
	  };

    $scope.doLogin = function () {

      let failCallBack = function (error) { //Erro call back
	      if (error.status == 400) {
		      // TODO
		      let req = "http://169.254.0.1/index.php/apps/oauth2/authorize?response_type=code&client_id=TkDJIPaAoovAseBEO0eh9ocHlvUcc7fxxHcSs9oSWvjnpTDT2QUmY71xdcw3boYy&redirect_uri=http://localhost:8000";
		      $window.location.href = req;
	      } else {
		      console.log('Login error: ' + JSON.stringify(error));
	      }
      };

	    AuthenticationService.signInWithOAuth($scope.username, doLoginSuccessCallBack, failCallBack);
    };

    $scope.getUsername = function () {
      return AuthenticationService.getUsername();
    };

    $scope.doLogout = function () {
      AuthenticationService.doLogout();
      $scope.username = undefined;
      $location.path('/');
    };

	  let authorizationCode = checkIfUrlHasAuthorizationCode();
	  if (authorizationCode !== undefined) {
		  var failCallback = function (error) {
			  console.log(error);
		  };
		  var successCallback = function (res) {
			  let accessToken = res.data.access_token;
			  let refreshToken = res.data.refresh_token;
			  $scope.username = res.data.user_id;

			  if ($scope.username !== undefined) {
				  ExternalOAuthService.postUserExternalOAuthToken($scope.username, accessToken, refreshToken, doLoginSuccessCallBack, failCallback);
			  }
		  };

		  ExternalOAuthService.requestOwncloudAccessToken(authorizationCode, successCallback, failCallback);
	  }
  }
);
