
pipeline {
    agent any

    options {
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Source code checked out from GitHub.'
            }
        }

        stage('Check Docker') {
            steps {
                bat 'docker info'
            }
        }

        stage('Backend Dependencies') {
            steps {
                dir('backend') {
                    bat 'npm ci'
                }
            }
        }

        stage('Frontend Dependencies') {
            steps {
                dir('frontend') {
                    bat 'npm ci'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    bat 'npm run build'
                }
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                bat 'docker build -t inventory-backend:latest -f backend\\Dockerfile backend'
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                bat 'docker build -t inventory-frontend:latest -f frontend\\Dockerfile frontend'
            }
        }
    }

    post {
        success {
            echo 'CI pipeline completed successfully. Docker images built.'
        }
        failure {
            echo 'Pipeline failed. Check Console Output.'
        }
        always {
            echo 'Pipeline execution finished.'
        }
    }
}
