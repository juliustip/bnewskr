import React, { Component } from 'react';

import SinglePost, {
    LeftColumn,
    CenterColumn,
    RightColumn,
    Post
} from 'components/SinglePost/SinglePost';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as single from 'redux/modules/single';
import * as modal from 'redux/modules/base/modal';
import * as auth from 'redux/modules/base/auth';
import * as form from 'redux/modules/form';

import { Loader } from 'semantic-ui-react'

import usersHelper from 'helpers/firebase/database/users';
import postsHelper from 'helpers/firebase/database/posts';
import commentsHelper from 'helpers/firebase/database/comments';

import Helmet from "react-helmet";

class SinglePostRoute extends Component {

    static contextTypes = {
        router: React.PropTypes.object
    }

    componentDidMount() {
        const { handlePostLoad } = this;
        const { FormActions } = this.props;

        handlePostLoad();

        //Initialise comment form
        FormActions.initialize('commentForm');
    }

    handlePostLoad = async () => {
        const { postId } = this.props.params;
        const { SinglePostActions } = this.props;
        const data = await postsHelper.watchPost(postId);
        console.log(data);
        if((data && data.post.isDeleted) || !data) {
            this.context.router.push('/404');
            return;
        }
        SinglePostActions.loadSinglePost(data);
    }

    openLoginModal = () => {
        const { ModalActions } = this.props;
        ModalActions.openModal({modalName: 'login'});
    }

    upvotePost = ({ itemId, upvotes }) => {
        const { auth, AuthActions, SinglePostActions } = this.props;
        const userId = auth.getIn(['profile', 'uid']);

        usersHelper.upvotePost({
            userId: userId,
            postId: itemId
        });
        AuthActions.upvotePost({
            userId: userId,
            postId: itemId
        });
        SinglePostActions.updateUpvotePost(upvotes+1);
    }

    downvotePost = ({ itemId, upvotes }) => {
        const { auth, AuthActions, SinglePostActions } = this.props;
        const userId = auth.getIn(['profile', 'uid']);

        usersHelper.downvotePost({
            userId: userId,
            postId: itemId
        });
        AuthActions.downvotePost({
            userId: userId,
            postId: itemId
        });
        SinglePostActions.updateUpvotePost(upvotes-1);
    }

    addComment = (comment) => {
        const { FormActions } = this.props;
        const { handlePostLoad } = this;
        commentsHelper.addComment(comment);
        // SinglePostActions.addComment(comment);

        handlePostLoad();

        //Initialise comment form
        FormActions.initialize('commentForm');
    }

    deleteComment = (comment) => {
        const { handlePostLoad } = this;
        commentsHelper.deleteComment(comment);
        // SinglePostActions.addComment(comment);

        handlePostLoad();
    }

    changeCommentForm = (e) => {
        const { FormActions } = this.props;
        const value = e.target.value;
        FormActions.change({
            formName: 'commentForm',
            name: 'text',
            value
        });
    }

    upvoteComment = ({ itemId, upvotes }) => {
        const { auth, SinglePostActions } = this.props;
        const userId = auth.getIn(['profile', 'uid']);

        commentsHelper.upvoteComment({
            userId: userId,
            commentId: itemId
        });

        SinglePostActions.updateUpvoteComment({
            commentId: itemId,
            upvotes: upvotes + 1
        });

    }

    downvoteComment = ({ itemId, upvotes }) => {
        const { auth, SinglePostActions } = this.props;
        const userId = auth.getIn(['profile', 'uid']);

        commentsHelper.downvoteComment({
            userId: userId,
            commentId: itemId
        });

        SinglePostActions.updateUpvoteComment({
            commentId: itemId,
            upvotes: upvotes - 1
        })

    }

    render () {
        const { single, auth, form } = this.props;
        const post = single.get('post');
        const { upvotePost, downvotePost, openLoginModal,
                addComment, deleteComment, changeCommentForm,
                upvoteComment, downvoteComment } = this;
        const { postId }  = this.props.params;

        return (
            <SinglePost>
                {
                    single.get('loaded') &&
                    <Helmet
                    htmlAttributes={{lang: "ko", amp: undefined}} // amp takes no value
                    title={`${post.get('title')} - 텔레토빗`}
                    titleAttributes={{itemprop: "name", lang: "ko"}}
                    base={{target: "_blank", href: "http://localhost:3000"}}
                    meta={[
                        {name: "description", content: `${post.get('description')} - 텔레토빗`},
                        {property: "og:type", content: "article"}
                    ]}
                    />
                }
                <LeftColumn>
                    Left
                </LeftColumn>
                <CenterColumn>
                    {
                        single.get('loaded') ?
                        (
                            <Post
                                post={post}
                                comments={single.get('comments')}
                                user={auth}
                                key={postId}
                                upvote={ upvotePost }
                                downvote={ downvotePost }
                                upvoteComment={ upvoteComment }
                                downvoteComment={ downvoteComment }
                                openLoginModal={openLoginModal}
                                addComment={ addComment }
                                deleteComment={ deleteComment }
                                changeCommentForm={changeCommentForm}
                                commentForm={ form.getIn(['commentForm', 'text'])}
                                />
                        ) :
                        (
                            <Loader active inline='centered' />
                        )
                    }
                </CenterColumn>
                <RightColumn>
                    Right
                </RightColumn>
            </SinglePost>
        )
    }
}

SinglePostRoute = connect(
    state => ({
        single: state.single,
        auth: state.base.auth,
        form: state.form
    }),
    dispatch => ({
        SinglePostActions: bindActionCreators(single, dispatch),
        AuthActions: bindActionCreators(auth, dispatch),
        ModalActions: bindActionCreators(modal, dispatch),
        FormActions: bindActionCreators(form, dispatch)
    })
)(SinglePostRoute);

export default SinglePostRoute;