pipeline {
    agent any
    triggers {
        githubPush()
    }
    environment {
        PROJECT_TYPE = 'nextjs'
        DEPLOY_HOST  = '172.31.77.148'
        DEPLOY_USER  = 'ubuntu'
        // Path to the root of the repo (we cd into 'web' later)
        LIVE_DIR     = '/var/www/html/development/nextjs-project'
        BRANCH_NAME  = 'development'
    }

    stages {
        stage('Build') {
            steps {
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            cd ${LIVE_DIR}
                            
                            # 1. Pull Latest Code
                            git fetch origin
                            git reset --hard origin/${BRANCH_NAME}

                            case \"${PROJECT_TYPE}\" in
                                nextjs)
                                    # Load Node 20
                                    export NVM_DIR=\\"\\$HOME/.nvm\\"
                                    [ -s \\"\\$NVM_DIR/nvm.sh\\" ] && . \\"\\$NVM_DIR/nvm.sh\\"
                                    nvm use 20
                                    
                                    # 2. Go into 'web' folder and Build
                                    cd web
                                    # Use the specific env file for development build
                                    npx env-cmd -f .env.development next build
                                    ;;
                            esac
                        "
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            
                            case \"${PROJECT_TYPE}\" in
                                nextjs)
                                    # Reload Nginx to update static files
                                    sudo systemctl reload nginx
                                    ;;
                            esac
                        "
                    '''
                }
            }
        }
    }
}
