pipeline {
    agent any
    triggers { githubPush() }
    
    environment {
        PROJECT_TYPE = 'nextjs'
        DEPLOY_HOST  = '172.31.77.148'
        DEPLOY_USER  = 'ubuntu'
        BRANCH_NAME  = 'development'
    }

    stages {
        stage('Build') {
            steps {
                sshagent(['deploy-server-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "
                            set -e
                            
                            case \"${PROJECT_TYPE}\" in
                                vue)    LIVE_DIR='/var/www/html/development/vue-project' ;;
                                nextjs) LIVE_DIR='/var/www/html/development/nextjs-project' ;;
                            esac
                            
                            cd \${LIVE_DIR}
                            git fetch origin
                            git reset --hard origin/${BRANCH_NAME}

                            export NVM_DIR=\\"\\$HOME/.nvm\\"
                            [ -s \\"\\$NVM_DIR/nvm.sh\\" ] && . \\"\\$NVM_DIR/nvm.sh\\"
                            nvm use 20

                            case \"${PROJECT_TYPE}\" in
                                vue)
                                    npm run build
                                    ;;
                                nextjs)
                                    cd web
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
                            sudo systemctl reload nginx
                        "
                    '''
                }
            }
        }
    }
}
