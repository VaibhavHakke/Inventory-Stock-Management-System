
pipeline {
    agent any

    options {
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Code checked out from GitHub.'
            }
        }

        stage('Check Docker') {
            steps {
                bat 'docker info'
                bat 'docker compose version'
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

        stage('Build Backend Image') {
            steps {
                bat 'docker build -t inventory-backend:latest -f backend\\Dockerfile backend'
            }
        }

        stage('Build Frontend Image') {
            steps {
                bat 'docker build -t inventory-frontend:latest -f frontend\\Dockerfile frontend'
            }
        }

        stage('Validate Compose') {
            steps {
                bat 'docker compose config --quiet'
            }
        }

        stage('Deploy with Compose') {
            steps {
                bat 'docker compose up -d --build'
            }
        }

        stage('Verify Containers') {
            steps {
                bat 'docker compose ps'
            }
        }
    }

    post {
        success {
            echo 'CI/CD pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed. Check Console Output.'
        }
        always {
            echo 'Pipeline execution finished.'
        }
    }
}
